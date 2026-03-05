from pydantic import BaseModel 
from datetime import date, datetime 
from typing import Optional, List
from uuid import UUID

"""
Pydantic takes care of validation and serialization
Validation Functionality:
- Validate requests from front end for data in the database
- Ensure requests match expected data type of attributes

Serialization Functionality:
- Convert Python objects into JSON that fron end can understand
- SQLAlchemy JobPosting object is an object with attributes while 
the front end expects JSON, so Pydantic takes care of the conversion
"""

class JobPostingResponse(BaseModel):
    id: int
    title: str
    employer: str
    posting_date: Optional[date] = None
    application_deadline: Optional[date] = None
    link_to_posting: Optional[str] = None
    mode: Optional[str] = None
    job_type: Optional[str] = None
    term: Optional[str] = None
    with_pay: Optional[bool] = True
    start_month: Optional[str] = None
    end_month: Optional[str] = None
    duration_months: Optional[float] = None
    province: Optional[str] = None
    city: Optional[str] = None
    target_audience: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    majors_required: Optional[list] = None
    other_academic_requirements: Optional[str] = None
    assets: Optional[str] = None
    employer_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    """
    When query the database, SQLAlchemy returns a JobPosting object
    where fields are accessed as attributes.

    However, Pydantic by default expects data as a dictionary, meaning
    Pydantic doesn't know how to read attributes off an object

    class Config tells Pydantic to do read attributes off the JobPosting object
    """
    class Config:
        from_attributes = True
    


"""
class JobPostingListResponse exists to send job postings in batch
from the database to the front end. 

This is because sending all existing job postings in the database
at once is slow and unnecessary since user's screen can't show 
all 500 jobs at the same time anyways
"""
class JobPostingListResponse(BaseModel):
    jobs: list[JobPostingResponse]
    total: int
    page: int
    page_size: int

class UploadResponse(BaseModel):
    jobs_added: int
    jobs_skipped: int
    errors: list[str]


# Saved Job schemas
class SavedJobCreate(BaseModel):
    job_id: int


class SavedJobResponse(BaseModel):
    id: int
    user_id: str
    job_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SavedJobWithDetails(BaseModel):
    id: int
    created_at: Optional[datetime] = None
    job: JobPostingResponse

    class Config:
        from_attributes = True



# Template schemas
class TemplateResponse(BaseModel):
    id: UUID
    template_name: str
    industry: str
    job_title: str
    seniority_level: str
    employment_type: str
    province: Optional[str] = None
    city: Optional[str] = None
    job_description: Optional[str] = None
    responsibilities: Optional[list] = None
    qualifications: Optional[str] = None
    compensation_min: Optional[float] = None
    compensation_max: Optional[float] = None

    class Config:
        from_attributes = True

class TemplateListResponse(BaseModel):
    templates: list[TemplateResponse]
    total: int

# Skill schemas
class SkillResponse(BaseModel):
    id: UUID
    skill_name: str
    skill_category: Optional[str] = None

    class Config:
        from_attributes = True

class SkillSearchResponse(BaseModel):
    skills: list[SkillResponse]

# JobDescription schemas
class JobDescriptionSkillInput(BaseModel):
    skill_id: UUID
    skill_type: str

class JobDescriptionCreate(BaseModel):
    template_id: Optional[UUID] = None
    job_title: str
    industry: Optional[str] = None
    job_function: Optional[str] = None
    seniority_level: Optional[str] = None
    employment_type: Optional[str] = None
    location_type: Optional[str] = None
    location_city: Optional[str] = None
    location_province: Optional[str] = None
    job_description: Optional[str] = None
    responsibilities: Optional[list] = None
    qualifications: Optional[str] = None
    compensation_min: Optional[float] = None
    compensation_max: Optional[float] = None
    compensation_currency: Optional[str] = "CAD"
    application_deadline: Optional[date] = None
    skills: Optional[List[JobDescriptionSkillInput]] = []


class JobDescriptionUpdate(BaseModel):
    job_title: Optional[str] = None
    industry: Optional[str] = None
    job_function: Optional[str] = None
    seniority_level: Optional[str] = None
    employment_type: Optional[str] = None
    location_type: Optional[str] = None
    location_city: Optional[str] = None
    location_province: Optional[str] = None
    job_description: Optional[str] = None
    responsibilities: Optional[list] = None
    qualifications: Optional[str] = None
    compensation_min: Optional[float] = None
    compensation_max: Optional[float] = None
    compensation_currency: Optional[str] = "CAD"
    application_deadline: Optional[date] = None
    skills: Optional[List[JobDescriptionSkillInput]] = None

class JobDescriptionSkillResponse(BaseModel):
    skill_id: UUID
    skill_name: str
    skill_type: str

    class Config:
        from_attributes = True

class JobDescriptionResponse(BaseModel):
    id: UUID
    user_id: str
    template_id: Optional[UUID] = None
    job_title: str
    industry: Optional[str] = None
    job_function: Optional[str] = None
    seniority_level: Optional[str] = None
    employment_type: Optional[str] = None
    location_type: Optional[str] = None
    location_city: Optional[str] = None
    location_province: Optional[str] = None
    job_description: Optional[str] = None
    responsibilities: Optional[list] = None
    qualifications: Optional[str] = None
    compensation_min: Optional[float] = None
    compensation_max: Optional[float] = None
    compensation_currency: Optional[str] = "CAD"
    application_deadline: Optional[date] = None
    status: str
    skills: List[JobDescriptionSkillResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True
    

class JobDescriptionListResponse(BaseModel):
    job_descriptions: list[JobDescriptionResponse]
    total: int
    page: int
    page_size: int

