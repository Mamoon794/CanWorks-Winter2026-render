from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Application, JobDescription, JobDescriptionSkill, Skill
from schemas import (
    EmployerAnalyticsResponse,
    PipelineStats,
    JobStatusCounts,
    TopSkillItem,
    TopUniversityItem,
)

router = APIRouter(prefix="/api/employer", tags=["Employer Analytics"])


@router.get("/analytics", response_model=EmployerAnalyticsResponse)
def get_employer_analytics(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get all employer's jobs
    employer_jobs = db.query(JobDescription).filter(JobDescription.user_id == user_id).all()
    job_ids = [j.id for j in employer_jobs]

    # Applications for employer's jobs
    applications = []
    if job_ids:
        applications = db.query(Application).filter(
            Application.job_description_id.in_(job_ids)
        ).all()

    # Pipeline breakdown
    pipeline_counts = {s: 0 for s in ["pending", "reviewing", "interview", "offer", "rejected", "hired"]}
    for app in applications:
        if app.status in pipeline_counts:
            pipeline_counts[app.status] += 1

    total_applications = len(applications)

    # Job status counts
    today = date.today()
    draft = 0
    published = 0
    expired = 0
    deleted = 0
    for j in employer_jobs:
        if j.deleted_at is not None:
            deleted += 1
        elif j.application_deadline and j.application_deadline < today:
            expired += 1
        elif j.status == "draft":
            draft += 1
        elif j.status == "published":
            published += 1

    total_published = published

    # Applications per position
    apps_per_position = round(total_applications / total_published, 1) if total_published > 0 else 0

    # Time to hire (avg days from applied_at to updated_at for hired applications)
    hired_apps = [a for a in applications if a.status == "hired"]
    time_to_hire = None
    if hired_apps:
        total_days = sum((a.updated_at - a.applied_at).total_seconds() / 86400 for a in hired_apps)
        time_to_hire = round(total_days / len(hired_apps), 1)

    # Offer acceptance rate: hired / (hired + offer) * 100
    offer_and_hired = pipeline_counts["offer"] + pipeline_counts["hired"]
    offer_acceptance = round((pipeline_counts["hired"] / offer_and_hired) * 100, 1) if offer_and_hired > 0 else None

    # Interview to hire ratio
    interview_to_hire = None
    interviews_total = pipeline_counts["interview"] + pipeline_counts["offer"] + pipeline_counts["hired"]
    if pipeline_counts["hired"] > 0 and interviews_total > 0:
        ratio = round(interviews_total / pipeline_counts["hired"])
        interview_to_hire = f"1:{ratio}"

    # Top skills across employer's jobs
    top_skills = []
    if job_ids:
        skill_rows = db.query(
            Skill.skill_name, func.count(JobDescriptionSkill.id).label("cnt")
        ).join(
            JobDescriptionSkill, Skill.id == JobDescriptionSkill.skill_id
        ).filter(
            JobDescriptionSkill.job_description_id.in_(job_ids)
        ).group_by(
            Skill.skill_name
        ).order_by(
            func.count(JobDescriptionSkill.id).desc()
        ).limit(10).all()
        top_skills = [TopSkillItem(skill_name=row[0], count=row[1]) for row in skill_rows]

    # Top universities from applicants
    top_universities = []
    if job_ids:
        uni_rows = db.query(
            Application.university, func.count(Application.id).label("cnt")
        ).filter(
            Application.job_description_id.in_(job_ids),
            Application.university.isnot(None),
            Application.university != "",
        ).group_by(
            Application.university
        ).order_by(
            func.count(Application.id).desc()
        ).limit(5).all()
        top_universities = [TopUniversityItem(university=row[0], count=row[1]) for row in uni_rows]

    return EmployerAnalyticsResponse(
        total_applications=total_applications,
        pipeline=PipelineStats(**pipeline_counts),
        applications_per_position=apps_per_position,
        time_to_hire_days=time_to_hire,
        offer_acceptance_rate=offer_acceptance,
        interview_to_hire_ratio=interview_to_hire,
        job_status_counts=JobStatusCounts(draft=draft, published=published, expired=expired, deleted=deleted),
        top_skills=top_skills,
        top_universities=top_universities,
        total_published_jobs=total_published,
    )
