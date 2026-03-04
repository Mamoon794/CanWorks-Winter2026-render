from datetime import datetime, date, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import JobDescription, JobDescriptionSkill, Skill
from schemas import (
    JobDescriptionCreate,
    JobDescriptionUpdate,
    JobDescriptionResponse,
    JobDescriptionListResponse,
    JobDescriptionSkillResponse
)

router = APIRouter(prefix="/api/job-descriptions", tags=["Job Descriptions"])

def _build_skill_responses(job: JobDescription) -> list:
    """
    Convert a job's skill relationships into response objects with skill names
    """
    result = []
    for js in job.skills:
        result.append(JobDescriptionSkillResponse(
            skill_id = js.skill_id,
            skill_name = js.skill.skill_name if js.skill else "",
            skill_type = js.skill_type
        ))
    return result

def _to_response(job: JobDescription) -> JobDescriptionResponse:
    """
    Convert a JobDescription model instance into a response schema
    """
    return JobDescriptionResponse(
        id=job.id,
        user_id=job.user_id,
        template_id=job.template_id,
        job_title=job.job_title,
        industry=job.industry,
        job_function=job.job_function,
        seniority_level=job.seniority_level,
        employment_type=job.employment_type,
        location_type=job.location_type,
        location_city=job.location_city,
        location_province=job.location_province,
        job_description=job.job_description,
        responsibilities=job.responsibilities,
        qualifications=job.qualifications,
        compensation_min=float(job.compensation_min) if job.compensation_min else None,
        compensation_max=float(job.compensation_max) if job.compensation_max else None,
        compensation_currency=job.compensation_currency,
        application_deadline=job.application_deadline,
        status=job.status,
        skills=_build_skill_responses(job),
        created_at=job.created_at,
        updated_at=job.updated_at,
        published_at=job.published_at
    )

def _get_owned_job(job_id: UUID, user_id: str, db: Session) -> JobDescription:
    """
    Fetch a job description and verify the current user owns it
    """
    job = db.query(JobDescription).filter(
        JobDescription.id == job_id,
        JobDescription.deleted_at.is_(None)
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
    if job.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return job


# Create a new draft
@router.post("", response_model=JobDescriptionResponse)
def create_job_description(
    data: JobDescriptionCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = JobDescription(
        user_id = user_id,
        template_id=data.template_id,
        job_title=data.job_title,
        industry=data.industry,
        job_function=data.job_function,
        seniority_level=data.seniority_level,
        employment_type=data.employment_type,
        location_type=data.location_type,
        location_city=data.location_city,
        location_province=data.location_province,
        job_description=data.job_description,
        responsibilities=data.responsibilities,
        qualifications=data.qualifications,
        compensation_min=data.compensation_min,
        compensation_max=data.compensation_max,
        compensation_currency=data.compensation_currency or "CAD",
        application_deadline=data.application_deadline,
        status="draft"
    )
    db.add(job)
    db.flush() # assign the UUID to job.id without committing yet

    if data.skills:
        for skill_input in data.skills:
            db.add(JobDescriptionSkill(
                job_description_id=job.id,
                skill_id=skill_input.skill_id,
                skill_type=skill_input.skill_type
            ))
    db.commit()
    db.refresh(job)
    return _to_response(job)

# List the employer's job descriptions
@router.get("", response_model=JobDescriptionListResponse)
def list_job_descriptions(
    status: str = Query(default=None),
    include_deleted: bool = Query(default=False),
    include_expired: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(JobDescription).filter(JobDescription.user_id == user_id)
    if include_deleted:
        # History tab: show deleted jobs
        query = query.filter(JobDescription.deleted_at.isnot(None))
    elif include_expired:
        # History tab: show expired jobs
        today = date.today()
        query = query.filter(
            JobDescription.deleted_at.is_(None),
            JobDescription.application_deadline.isnot(None),
            JobDescription.application_deadline < today
        )
    else:
        # Drafts/Active tabs: exclude deleted and expired
        today = date.today()
        query = query.filter(JobDescription.deleted_at.is_(None))
        query = query.filter(
            (JobDescription.application_deadline.is_(None)) |
            (JobDescription.application_deadline >= today)
        )
    
    if status:
        query = query.filter(JobDescription.status == status)
    
    query = query.order_by(JobDescription.updated_at.desc())
    total = query.count()
    jobs = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return JobDescriptionListResponse(
        job_descriptions=[_to_response(j) for j in jobs],
        total=total,
        page=page,
        page_size=page_size
    )


# fetch one job for editing in the wizard
@router.get("/{job_id}", response_model=JobDescriptionResponse)
def get_job_description(
    job_id: UUID,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = _get_owned_job(job_id, user_id, db)
    return _to_response(job)


@router.put("/{job_id}", response_model=JobDescriptionResponse)
def update_job_description(
    job_id: UUID,
    data: JobDescriptionUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = _get_owned_job(job_id, user_id, db)

    # Only update fields that were actually sent in the request
    update_data = data.model_dump(exclude_unset=True)
    skills_data = update_data.pop("skills", None)

    for key, value in update_data.items():
        setattr(job, key, value)
    
    job.updated_at = datetime.now(timezone.utc)

    # If skills were included, replace them entirely
    if skills_data is not None:
        db.query(JobDescriptionSkill).filter(
            JobDescriptionSkill.job_description_id == job.id
        ).delete()
        for skill_input in skills_data:
            db.add(JobDescriptionSkill(
                job_description_id=job.id,
                skill_id=skill_input["skill_id"],
                skill_type=skill_input["skill_type"]
            ))
    db.commit()
    db.refresh(job)
    return _to_response(job)


@router.post("/{job_id}/publish",response_model=JobDescriptionResponse)
def publish_job_description(
    job_id: UUID,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = _get_owned_job(job_id, user_id, db)

    # Validate all required fields before publishing
    errors = []
    if not job.job_title or len(job.job_title) < 3:
        errors.append("Job title is required (min 3 characters)")
    if not job.job_description:
        errors.append("Job description is required")
    if not job.responsibilities:
        errors.append("At least 1 responsibility is required")
    
    required_skills = [s for s in job.skills if s.skill_type == "required"]
    if len(required_skills) < 1:
        errors.append("At least 1 required skill is needed")
    if job.compensation_min is None:
        errors.append("Compensation range minimum is required")
    if job.compensation_max is None:
        errors.append("Compensation range maximum is required")
    
    if errors:
        raise HTTPException(status_code=422, detail={"validation_errors": errors})
    
    job.status = "published"
    job.published_at = datetime.now(timezone.utc)
    job.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return _to_response(job)


@router.post("/{job_id}/unpublish", response_model=JobDescriptionResponse)
def unpublish_job_description(
    job_id: UUID,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = _get_owned_job(job_id, user_id, db)
    job.status = "draft"
    job.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return _to_response(job)

# Create a copy of another job description
@router.post("/{job_id}/duplicate", response_model=JobDescriptionResponse)
def duplicate_job_description(
    job_id: UUID,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    original = _get_owned_job(job_id, user_id, db)
    new_job = JobDescription(
        user_id=user_id,
        template_id=original.template_id,
        job_title=original.job_title,
        industry=original.industry,
        job_function=original.job_function,
        seniority_level=original.seniority_level,
        employment_type=original.employment_type,
        location_type=original.location_type,
        location_city=original.location_city,
        location_province=original.location_province,
        job_description=original.job_description,
        responsibilities=original.responsibilities,
        qualifications=original.qualifications,
        compensation_min=original.compensation_min,
        compensation_max=original.compensation_max,
        compensation_currency=original.compensation_currency,
        application_deadline=original.application_deadline,
        status="draft",
    )
    db.add(new_job)
    db.flush()

    for skill in original.skills:
        db.add(JobDescriptionSkill(
            job_description_id=new_job.id,
            skill_id=skill.skill_id,
            skill_type=skill.skill_type
        ))
    db.commit()
    db.refresh(new_job)
    return _to_response(new_job)

@router.delete("/{job_id}")
def delete_job_description(
    job_id: UUID,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = _get_owned_job(job_id, user_id, db)
    job.deleted_at = datetime.now(timezone.utc)
    job.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Job description deleted"}
        



