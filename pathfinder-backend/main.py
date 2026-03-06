from fastapi import FastAPI
from fastapi import UploadFile, File # handle file uploads
from fastapi import Depends
from fastapi import Query # Define query parameters with defaults and validation 
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_ # SQLAlchemy OR operator for combining search conditions
from database import engine, get_db, Base
from models import JobPosting, SavedJob, CareerInsight, JobEvent
from schemas import JobPostingResponse, JobPostingListResponse, UploadResponse
from schemas import SavedJobCreate, SavedJobResponse, SavedJobWithDetails
from schemas import CareerInsightCreate, CareerInsightsResponse, ImageUploadResponse
from excel_parser import parse_excel_file
from fastapi import HTTPException
import numpy as np
from sentence_transformers import SentenceTransformer
from schemas import JobEventCreate

from routes.job_descriptions import router as job_descriptions_router
from routes.templates import router as templates_router
from routes.skills import router as skills_router
from upload_images import upload_career_images

from jwt_auth import verify_jwt

app = FastAPI()
"""
Browsers block requests between different origins by default. 
Frontend and backend can run on different ports so to the brwoser, these are different origins.
Middleware allows the communication between the frontend and the backend
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specify frontend origins
    allow_credentials=True,
    allow_methods=["*"],  # Explicitly allow needed methods
    allow_headers=["*"],  # Allow all headers including Authorization
)

# Tell SQLAlchemy to look at all classes that inherit from Base (JobPosting model in this case)
# and create the table in the database if it doesn't already exist
Base.metadata.create_all(bind=engine)

# Load embedding model (SentenceTransformers) once at startup
_embed_model = SentenceTransformer('all-MiniLM-L6-v2')

def embed_text(text: str):
    if not text:
        return None
    vec = _embed_model.encode(text)
    return vec.tolist()

# include all the routers
app.include_router(job_descriptions_router)
app.include_router(templates_router)
app.include_router(skills_router)

# Upload endpoint
# register a POST route
# response_model tells FastAPI to validate and serialize the return value using Pydantic schema
@app.post("/api/upload-jobs", response_model=UploadResponse)
async def upload_jobs(file: UploadFile = File(...), db: Session = Depends(get_db)): # The ... indicates that a file is required
    contents = await file.read() # read the uploaded file into memory
    jobs, parse_errors = parse_excel_file(contents)

    jobs_added = 0
    jobs_skipped = 0

    for job_data in jobs:
        existing = db.query(JobPosting).filter(JobPosting.dedupe_hash == job_data["dedupe_hash"]).first()
        if existing:
            jobs_skipped += 1
            continue

        db_job = JobPosting(**job_data) # The ** breaks the dictionary representation of each job into keyword arguments. Equivalent to JobPosting(title="...", employer="...", ...)
        # compute embedding for job content (title + employer + description)
        try:
            text_blob = ' '.join(filter(None, [str(job_data.get('title', '')), str(job_data.get('employer', '')), str(job_data.get('description', ''))]))
            emb = embed_text(text_blob)
            if emb is not None:
                db_job.embedding = emb
        except Exception:
            pass
        db.add(db_job) # stage the new row
        jobs_added += 1
    
    db.commit() # write all staged rows to the database at once

    return UploadResponse(
        jobs_added=jobs_added,
        jobs_skipped=jobs_skipped,
        errors=parse_errors
    )

@app.get("/api/jobs", response_model=JobPostingListResponse)
def get_jobs(
    page: int=Query(default=1, ge=1), # ge means greater than or equal to ensure page is at least 1
    page_size: int=Query(default=20, ge=1, le=100), # le means less than or equal to ensure a page doesn't display more than 100 jobs
    search: str=Query(default=None),
    job_type: str=Query(default=None),
    mode: str=Query(default=None),
    province: str=Query(default=None),
    target_audience: str=Query(default=None),
    db: Session=Depends(get_db) # This tells FastAPI that before running get_jobs, call get_db and get a database session back then pass it as the db parameter
):
    query = db.query(JobPosting).filter(JobPosting.is_active == True)
    if search:
        query = query.filter(
            or_(
                JobPosting.title.ilike(f"%{search}%"), # search for substring match
                JobPosting.employer.ilike(f"%{search}%"),
                JobPosting.description.ilike(f"%{search}%")
            )
        )
    
    if job_type:
        query = query.filter(JobPosting.job_type == job_type)
    if mode:
        query = query.filter(JobPosting.mode == mode)
    if province:
        query = query.filter(JobPosting.province == province)
    if target_audience:
        query = query.filter(JobPosting.target_audience == target_audience)
    
    total = query.count()
    # offset = (page - 1) * page_size
    # number of jobs displayed in 1 page = page_size
    jobs = query.offset((page - 1) * page_size).limit(page_size).all()

    return JobPostingListResponse(
        jobs=jobs,
        total=total,
        page=page,
        page_size=page_size
    )

# stats endpoint counting active jobs
@app.get("/api/jobs/stats")
def get_job_stats(db: Session = Depends(get_db)):
    total = db.query(JobPosting).filter(JobPosting.is_active == True).count()
    return {
        "total_jobs": total
    }

# Single job endpoint
@app.get("/api/jobs/{job_id}", response_model=JobPostingResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# -----------------------------
# POST - Save Job
# -----------------------------
@app.post("/api/saved-jobs", response_model=SavedJobResponse)
def save_job(
    payload: SavedJobCreate,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]  # extracted from JWT

    job = db.query(JobPosting).filter(
        JobPosting.id == payload.job_id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(SavedJob).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == payload.job_id
    ).first()

    if existing:
        return existing

    saved = SavedJob(
        user_id=user_id,
        job_id=payload.job_id
    )

    db.add(saved)
    db.commit()
    db.refresh(saved)

    return saved


# -----------------------------
# DELETE - Unsave Job
# -----------------------------
@app.delete("/api/saved-jobs/{job_id}")
def unsave_job(
    job_id: int,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]

    saved = db.query(SavedJob).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == job_id
    ).first()

    if not saved:
        raise HTTPException(status_code=404, detail="Saved job not found")

    db.delete(saved)
    db.commit()

    return {"message": "Removed from saved jobs"}


# -----------------------------
# GET - Fetch Saved Jobs
# -----------------------------
@app.get("/api/saved-jobs", response_model=list[SavedJobWithDetails])
def get_saved_jobs(
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]

    saved_jobs = db.query(SavedJob).options(
        joinedload(SavedJob.job)
    ).filter(
        SavedJob.user_id == user_id
    ).all()

    return saved_jobs


@app.post("/api/create-career-insights", response_model=CareerInsightsResponse)
def create_career_insights(
    payload: CareerInsightCreate,
    db: Session = Depends(get_db)
):
    career_insight = CareerInsight(
        title=payload.title,
        category=payload.category,
        excerpt=payload.excerpt,
        content=payload.content,
        articleLink=payload.articleLink,
        imageUrl=payload.imageUrl,
        readTime=payload.readTime,
    )

    db.add(career_insight)
    db.commit()
    db.refresh(career_insight)

    return career_insight


@app.post("/api/upload-career-image", response_model=ImageUploadResponse)
async def upload_career_image(file: UploadFile = File(...)):
    result = await upload_career_images(file)
    return ImageUploadResponse(
        url=result["url"],
        filename=result["filename"]
    )


@app.get("/api/career-insights", response_model=list[CareerInsightsResponse])
def get_career_insights(db: Session = Depends(get_db)):
    insights = db.query(CareerInsight).order_by(CareerInsight.created_at.desc()).all()
    return insights


# -----------------------------
# POST - Log Job Event (view/save/apply)
# -----------------------------
@app.post("/api/job-events")
def log_job_event(payload: JobEventCreate, user=Depends(verify_jwt), db: Session = Depends(get_db)):
    user_id = user["sub"]

    # ensure job exists
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    event = JobEvent(user_id=user_id, job_id=payload.job_id, event_type=payload.event_type)
    db.add(event)
    db.commit()
    return {"status": "ok"}


# -----------------------------
# GET - Recommendations (content-based)
# -----------------------------
@app.get("/api/recommendations", response_model=JobPostingListResponse)
def get_recommendations(k: int = 10, user=Depends(verify_jwt), db: Session = Depends(get_db)):
    user_id = user["sub"]

    # collect embeddings from saved jobs and recent views
    saved = db.query(SavedJob).filter(SavedJob.user_id == user_id).all()
    view_events = db.query(JobEvent).filter(JobEvent.user_id == user_id, JobEvent.event_type == 'view').order_by(JobEvent.created_at.desc()).limit(20).all()

    emb_list = []
    for s in saved:
        if s.job and getattr(s.job, 'embedding', None):
            emb_list.append(np.array(s.job.embedding))
    for e in view_events:
        if e.job and getattr(e.job, 'embedding', None):
            emb_list.append(np.array(e.job.embedding))

    if len(emb_list) == 0:
        # fallback: return most recent active jobs
        query = db.query(JobPosting).filter(JobPosting.is_active == True).order_by(JobPosting.created_at.desc()).limit(k).all()
        total = db.query(JobPosting).filter(JobPosting.is_active == True).count()
        return JobPostingListResponse(jobs=query, total=total, page=1, page_size=k)

    user_emb = np.mean(np.stack(emb_list, axis=0), axis=0)

    # fetch candidate jobs with embeddings
    candidates = db.query(JobPosting).filter(JobPosting.is_active == True).all()
    scored = []
    for job in candidates:
        if not getattr(job, 'embedding', None):
            continue
        job_emb = np.array(job.embedding)
        # cosine similarity
        sim = float(np.dot(user_emb, job_emb) / (np.linalg.norm(user_emb) * np.linalg.norm(job_emb) + 1e-10))
        scored.append((sim, job))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [j for _, j in scored[:k]]
    total = len(scored)
    return JobPostingListResponse(jobs=top, total=total, page=1, page_size=k)
