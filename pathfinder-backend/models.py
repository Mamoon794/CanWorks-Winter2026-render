import uuid
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, Date, DateTime, JSON, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship
from database import Base


class JobPosting(Base): # jobs uploaded by admins via Excel files
    # Create a table called job_postings
    __tablename__ = "job_postings"
    id = Column(Integer, primary_key = True, autoincrement=True)
    title = Column(String, nullable=False)
    employer = Column(String, nullable=False)
    posting_date = Column(Date, nullable=True)
    application_deadline = Column(Date, nullable=True)
    link_to_posting = Column(String, nullable=True)
    mode = Column(String, nullable=True)
    job_type = Column(String, nullable=True)
    term = Column(String, nullable=True)
    with_pay = Column(Boolean, default=True)
    start_month = Column(String, nullable=True)
    end_month = Column(String, nullable=True)
    duration_months = Column(Float, nullable=True)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)
    description = Column(Text, nullable=True) # Text is different from String: Text stores longer content
    responsibilities = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    majors_required = Column(JSON, nullable=True)
    other_academic_requirements = Column(Text, nullable=True)
    assets = Column(Text, nullable=True)
    employer_notes = Column(Text, nullable=True)
    compensation_min = Column(Numeric, nullable=True)
    compensation_max = Column(Numeric, nullable=True)
    job_description_id = Column(UUID(as_uuid=True), nullable=True)

    # metadata
    dedupe_hash = Column(String, unique=True, index=True) # index=True to create a db index so lookups by hash are fast
    is_active = Column(Boolean, default=True)
    # wrap datetime.now in a lambda so datetime.now runs fresh for each insert
    # without lambda, the function datetime.now is only invoked once when the table is created, making all entries have the same created_at time
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))
    # dense vector embedding for semantic search (SentenceTransformers -- 384 dims)
    embedding = Column(Vector(384), nullable=True)


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Supabase auth user id (JWT "sub")
    user_id = Column(String, nullable=False, index=True)

    # Foreign key to your existing job_postings table
    job_id = Column(Integer, ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Prevent duplicate saves
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="unique_user_job"),
    )

    # Lets you access saved_job.job
    job = relationship("JobPosting")


class JobEvent(Base):
    __tablename__ = "job_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)  # e.g., 'view', 'save', 'apply'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    job = relationship("JobPosting")



class Template(Base):
    __tablename__ = "templates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    seniority_level = Column(String, nullable=False)
    employment_type = Column(String, nullable=False)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    job_description = Column(Text, nullable=True)
    responsibilities = Column(JSON, nullable=True)
    qualifications = Column(Text, nullable=True)
    compensation_min = Column(Numeric, nullable=True)
    compensation_max = Column(Numeric, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))


class Skill(Base):
    __tablename__ = "skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_name = Column(String, nullable=False, unique=True)
    skill_category = Column(String, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class JobDescription(Base): # jobs that employers create themselves
    __tablename__ = "job_descriptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=True)
    job_title = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    job_function = Column(String, nullable=True)
    seniority_level = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    location_type = Column(String, nullable=True)
    location_city = Column(String, nullable=True)
    location_province = Column(String, nullable=True)
    job_description = Column(Text, nullable=True)
    responsibilities = Column(JSON, nullable=True)
    qualifications = Column(Text, nullable=True)
    compensation_min = Column(Numeric, nullable=True)
    compensation_max = Column(Numeric, nullable=True)
    compensation_currency = Column(String, default="CAD")
    application_deadline = Column(Date, nullable=True)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))
    published_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    skills = relationship("JobDescriptionSkill", back_populates="job_description", cascade="all, delete-orphan")


class JobDescriptionSkill(Base): # Relationship table connecting Skill and JobDescription
    __tablename__ = "job_description_skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_description_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)
    skill_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    job_description = relationship("JobDescription", back_populates="skills")
    skill = relationship("Skill")


class Application(Base):
    __tablename__ = "applications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_user_id = Column(String, nullable=False, index=True)
    job_description_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending")  # pending, reviewing, interview, offer, rejected, hired
    student_name = Column(String, nullable=True)
    student_email = Column(String, nullable=True)
    university = Column(String, nullable=True)
    major = Column(String, nullable=True)
    graduation_year = Column(String, nullable=True)
    relevant_experience = Column(Text, nullable=True)
    resume_url = Column(String, nullable=True)
    resume_filename = Column(String, nullable=True)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("student_user_id", "job_description_id", name="unique_student_application"),
    )

    job_description = relationship("JobDescription")


class ClickEvent(Base):
    __tablename__ = "click_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=True, index=True)
    job_id = Column(Integer, nullable=True)
    job_type = Column(String, nullable=True)
    url = Column(String, nullable=False)
    clicked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserVisit(Base):
    __tablename__ = "user_visits"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    visited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class FeedLog(Base):
    __tablename__ = "feed_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)
    status = Column(String, nullable=False)
    jobs_added = Column(Integer, default=0)
    jobs_skipped = Column(Integer, default=0)
    errors = Column(JSON, nullable=True)
    uploaded_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CareerInsight(Base):
    __tablename__ = "career_insights"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    articleLink = Column(String, nullable=True)
    imageUrl = Column(String, nullable=True)
    readTime = Column(String, nullable=True)
    status = Column(String, default="published")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

