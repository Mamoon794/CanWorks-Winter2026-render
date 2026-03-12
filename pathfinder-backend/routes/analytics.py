from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session

from auth import get_current_user
from jwt_auth import verify_jwt
from database import get_db
from models import Application, JobDescription, JobDescriptionSkill, Skill, JobPosting, SavedJob, ClickEvent, UserVisit, FeedLog
from schemas import (
    EmployerAnalyticsResponse,
    PipelineStats,
    JobStatusCounts,
    TopSkillItem,
    TopUniversityItem,
    AdminAnalyticsResponse,
    JobsByTypeItem,
    JobsByProvinceItem,
    ClicksByTypeItem,
    UserCountItem,
    FeedLogItem,
    ClickEventCreate,
)
from upload_images import _get_supabase

router = APIRouter(prefix="/api", tags=["Analytics"])


@router.get("/employer/analytics", response_model=EmployerAnalyticsResponse)
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


@router.get("/admin/analytics", response_model=AdminAnalyticsResponse)
def get_admin_analytics(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()

    # Total active admin-uploaded jobs
    total_admin_jobs = db.query(JobPosting).filter(JobPosting.is_active == True).count()

    # Employer jobs — published and not deleted, not expired
    total_employer_jobs = db.query(JobDescription).filter(
        JobDescription.status == "published",
        JobDescription.deleted_at.is_(None),
        (JobDescription.application_deadline.is_(None)) | (JobDescription.application_deadline >= today),
    ).count()

    # Platform-wide applications + pipeline
    all_apps = db.query(Application).all()
    total_applications = len(all_apps)
    pipeline_counts = {s: 0 for s in ["pending", "reviewing", "interview", "offer", "rejected", "hired"]}
    for app in all_apps:
        if app.status in pipeline_counts:
            pipeline_counts[app.status] += 1

    # Jobs by type (from admin-uploaded jobs)
    type_rows = db.query(
        JobPosting.job_type, func.count(JobPosting.id)
    ).filter(
        JobPosting.is_active == True,
        JobPosting.job_type.isnot(None),
    ).group_by(JobPosting.job_type).all()
    jobs_by_type = [JobsByTypeItem(job_type=row[0], count=row[1]) for row in type_rows if row[0]]

    # Jobs by province (combine admin + employer jobs)
    admin_prov = db.query(
        JobPosting.province, func.count(JobPosting.id)
    ).filter(
        JobPosting.is_active == True,
        JobPosting.province.isnot(None),
        JobPosting.province != "",
    ).group_by(JobPosting.province).all()

    employer_prov = db.query(
        JobDescription.location_province, func.count(JobDescription.id)
    ).filter(
        JobDescription.status == "published",
        JobDescription.deleted_at.is_(None),
        JobDescription.location_province.isnot(None),
        JobDescription.location_province != "",
    ).group_by(JobDescription.location_province).all()

    prov_map: dict[str, int] = {}
    for row in admin_prov:
        prov_map[row[0]] = prov_map.get(row[0], 0) + row[1]
    for row in employer_prov:
        prov_map[row[0]] = prov_map.get(row[0], 0) + row[1]
    jobs_by_province = sorted(
        [JobsByProvinceItem(province=k, count=v) for k, v in prov_map.items()],
        key=lambda x: x.count, reverse=True,
    )

    # Saved jobs
    total_saved_jobs = db.query(SavedJob).count()
    unique_savers = db.query(func.count(distinct(SavedJob.user_id))).scalar() or 0
    avg_saved = round(total_saved_jobs / unique_savers, 1) if unique_savers > 0 else 0

    # Top skills (platform-wide across all employer jobs)
    skill_rows = db.query(
        Skill.skill_name, func.count(JobDescriptionSkill.id).label("cnt")
    ).join(
        JobDescriptionSkill, Skill.id == JobDescriptionSkill.skill_id
    ).group_by(Skill.skill_name).order_by(
        func.count(JobDescriptionSkill.id).desc()
    ).limit(10).all()
    top_skills = [TopSkillItem(skill_name=row[0], count=row[1]) for row in skill_rows]

    # Top universities (platform-wide)
    uni_rows = db.query(
        Application.university, func.count(Application.id).label("cnt")
    ).filter(
        Application.university.isnot(None),
        Application.university != "",
    ).group_by(Application.university).order_by(
        func.count(Application.id).desc()
    ).limit(5).all()
    top_universities = [TopUniversityItem(university=row[0], count=row[1]) for row in uni_rows]

    # Employer job status counts (platform-wide)
    all_employer_jobs = db.query(JobDescription).all()
    draft = published = expired = deleted = 0
    for j in all_employer_jobs:
        if j.deleted_at is not None:
            deleted += 1
        elif j.application_deadline and j.application_deadline < today:
            expired += 1
        elif j.status == "draft":
            draft += 1
        elif j.status == "published":
            published += 1

    # Clicks by job type
    click_rows = db.query(
        ClickEvent.job_type, func.count(ClickEvent.id)
    ).filter(
        ClickEvent.job_type.isnot(None),
        ClickEvent.job_type != "",
    ).group_by(ClickEvent.job_type).order_by(
        func.count(ClickEvent.id).desc()
    ).all()
    clicks_by_type = [ClicksByTypeItem(job_type=row[0], clicks=row[1]) for row in click_rows]

    # Returning visitor rate (% of users who visited more than once in the last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_visitors = db.query(
        UserVisit.user_id, func.count(UserVisit.id).label("visit_count")
    ).filter(
        UserVisit.visited_at >= thirty_days_ago,
    ).group_by(UserVisit.user_id).all()

    total_visitors = len(recent_visitors)
    returning = sum(1 for row in recent_visitors if row[1] > 1)
    returning_rate = round((returning / total_visitors) * 100, 1) if total_visitors > 0 else None

    # Registered user counts from Supabase Auth
    user_counts: list[UserCountItem] = []
    try:
        client = _get_supabase()
        page = 1
        all_users = []
        while True:
            batch = client.auth.admin.list_users(page=page, per_page=1000)
            if not batch:
                break
            all_users.extend(batch)
            if len(batch) < 1000:
                break
            page += 1

        type_counts: dict[str, int] = {}
        for u in all_users:
            meta = getattr(u, "user_metadata", None) or {}
            ud = meta.get("userData", {})
            ut = ud.get("userType", "unknown")
            type_counts[ut] = type_counts.get(ut, 0) + 1
        user_counts = [UserCountItem(user_type=k, count=v) for k, v in sorted(type_counts.items())]
    except Exception:
        pass  # Supabase unavailable — return empty list

    # Recent feed logs
    recent_logs = db.query(FeedLog).order_by(FeedLog.created_at.desc()).limit(20).all()

    return AdminAnalyticsResponse(
        total_admin_jobs=total_admin_jobs,
        total_employer_jobs=total_employer_jobs,
        total_applications=total_applications,
        pipeline=PipelineStats(**pipeline_counts),
        jobs_by_type=jobs_by_type,
        jobs_by_province=jobs_by_province,
        total_saved_jobs=total_saved_jobs,
        avg_saved_per_user=avg_saved,
        top_skills=top_skills,
        top_universities=top_universities,
        employer_job_status=JobStatusCounts(draft=draft, published=published, expired=expired, deleted=deleted),
        clicks_by_type=clicks_by_type,
        returning_visitor_rate=returning_rate,
        user_counts=user_counts,
        recent_feed_logs=recent_logs,
    )


# --- Tracking endpoints ---

@router.post("/track-click")
def track_click(
    data: ClickEventCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = None
    try:
        user = verify_jwt(request)
        user_id = user["sub"]
    except Exception:
        pass  # anonymous clicks are still tracked

    event = ClickEvent(
        user_id=user_id,
        job_id=data.job_id,
        job_type=data.job_type,
        url=data.url,
    )
    db.add(event)
    db.commit()
    return {"ok": True}


@router.post("/track-visit")
def track_visit(
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        user = verify_jwt(request)
        user_id = user["sub"]
    except Exception:
        return {"ok": False}  # only track authenticated visits

    visit = UserVisit(user_id=user_id)
    db.add(visit)
    db.commit()
    return {"ok": True}
