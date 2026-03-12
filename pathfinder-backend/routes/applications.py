import uuid as uuid_mod
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request
from sqlalchemy.orm import Session

from auth import get_current_user
from jwt_auth import verify_jwt
from database import get_db
from models import Application, JobDescription
from schemas import (
    ApplicationStatusUpdate,
    ApplicationResponse,
    ApplicationListResponse,
)
from upload_images import _get_supabase

router = APIRouter(prefix="/api/applications", tags=["Applications"])

VALID_STATUSES = {"pending", "reviewing", "interview", "offer", "rejected", "hired"}
RESUME_BUCKET = "resumes"


def _to_response(app: Application) -> ApplicationResponse:
    return ApplicationResponse(
        id=app.id,
        student_user_id=app.student_user_id,
        job_description_id=app.job_description_id,
        status=app.status,
        student_name=app.student_name,
        student_email=app.student_email,
        university=app.university,
        major=app.major,
        graduation_year=app.graduation_year,
        relevant_experience=app.relevant_experience,
        resume_url=app.resume_url,
        resume_filename=app.resume_filename,
        applied_at=app.applied_at,
        updated_at=app.updated_at,
        job_title=app.job_description.job_title if app.job_description else None,
    )


# Student applies to a job (multipart form for resume upload)
@router.post("", response_model=ApplicationResponse)
async def apply_to_job(
    request: Request,
    job_description_id: str = Form(...),
    student_name: str = Form(default=""),
    student_email: str = Form(default=""),
    university: str = Form(default=""),
    major: str = Form(default=""),
    graduation_year: str = Form(default=""),
    relevant_experience: str = Form(default=""),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Extract user from JWT manually since Form params conflict with Depends(verify_jwt)
    user = verify_jwt(request)
    student_id = user["sub"]

    job_desc_uuid = UUID(job_description_id)

    # Verify job exists, is published, and not deleted
    job = db.query(JobDescription).filter(
        JobDescription.id == job_desc_uuid,
        JobDescription.status == "published",
        JobDescription.deleted_at.is_(None),
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not accepting applications")

    # Check deadline
    if job.application_deadline and job.application_deadline < date.today():
        raise HTTPException(status_code=400, detail="Application deadline has passed")

    # Prevent duplicate
    existing = db.query(Application).filter(
        Application.student_user_id == student_id,
        Application.job_description_id == job_desc_uuid,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already applied to this job")

    # Validate resume is a PDF
    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Resume must be a PDF file")
    if resume.content_type and resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Resume must be a PDF file")

    # Upload to Supabase Storage
    original_filename = resume.filename
    unique_filename = f"{uuid_mod.uuid4()}.pdf"
    contents = await resume.read()
    try:
        client = _get_supabase()
        client.storage.from_(RESUME_BUCKET).upload(
            path=unique_filename,
            file=contents,
            file_options={"content-type": "application/pdf"},
        )
        resume_url = client.storage.from_(RESUME_BUCKET).get_public_url(unique_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload resume: {str(e)}")

    application = Application(
        student_user_id=student_id,
        job_description_id=job_desc_uuid,
        student_name=student_name or None,
        student_email=student_email or None,
        university=university or None,
        major=major or None,
        graduation_year=graduation_year or None,
        relevant_experience=relevant_experience or None,
        resume_url=resume_url,
        resume_filename=original_filename,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return _to_response(application)


# Student views their own applications
@router.get("/mine", response_model=ApplicationListResponse)
def get_my_applications(
    status: str = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    student_id = user["sub"]
    query = db.query(Application).filter(Application.student_user_id == student_id)

    if status:
        query = query.filter(Application.status == status)

    query = query.order_by(Application.applied_at.desc())
    total = query.count()
    apps = query.offset((page - 1) * page_size).limit(page_size).all()

    return ApplicationListResponse(
        applications=[_to_response(a) for a in apps],
        total=total,
        page=page,
        page_size=page_size,
    )


# Employer lists applications for their jobs
@router.get("", response_model=ApplicationListResponse)
def list_applications(
    job_description_id: UUID = Query(default=None),
    status: str = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get all job IDs owned by this employer
    employer_job_ids = [
        j.id for j in db.query(JobDescription.id).filter(
            JobDescription.user_id == user_id,
            JobDescription.deleted_at.is_(None),
        ).all()
    ]

    if not employer_job_ids:
        return ApplicationListResponse(applications=[], total=0, page=page, page_size=page_size)

    query = db.query(Application).filter(Application.job_description_id.in_(employer_job_ids))

    if job_description_id:
        query = query.filter(Application.job_description_id == job_description_id)
    if status:
        query = query.filter(Application.status == status)

    query = query.order_by(Application.applied_at.desc())
    total = query.count()
    apps = query.offset((page - 1) * page_size).limit(page_size).all()

    return ApplicationListResponse(
        applications=[_to_response(a) for a in apps],
        total=total,
        page=page,
        page_size=page_size,
    )


# Employer updates application status
@router.put("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: UUID,
    data: ApplicationStatusUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify the employer owns the job this application belongs to
    job = db.query(JobDescription).filter(JobDescription.id == application.job_description_id).first()
    if not job or job.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    application.status = data.status
    db.commit()
    db.refresh(application)
    return _to_response(application)
