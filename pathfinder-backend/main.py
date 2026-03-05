from fastapi import FastAPI
from fastapi import UploadFile, File # handle file uploads
from fastapi import Depends
from fastapi import Query # Define query parameters with defaults and validation 
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_ # SQLAlchemy OR operator for combining search conditions
from database import engine, get_db, Base
from models import JobPosting, SavedJob
from schemas import JobPostingResponse, JobPostingListResponse, UploadResponse
from schemas import SavedJobCreate, SavedJobResponse, SavedJobWithDetails
from excel_parser import parse_excel_file
from fastapi import HTTPException

from jwt_auth import verify_jwt

app = FastAPI()
"""
Browsers block requests between different origins by default. 
Frontend and backend can run on different ports so to the brwoser, these are different origins.
Middleware allows the communication between the frontend and the backend
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],  # Specify frontend origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly allow needed methods
    allow_headers=["*"],  # Allow all headers including Authorization
)

# Tell SQLAlchemy to look at all classes that inherit from Base (JobPosting model in this case)
# and create the table in the database if it doesn't already exist
Base.metadata.create_all(bind=engine)

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