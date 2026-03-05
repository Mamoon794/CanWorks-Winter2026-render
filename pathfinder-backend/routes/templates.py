from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Template
from schemas import TemplateResponse, TemplateListResponse

router = APIRouter(prefix="/api/templates", tags=["Templates"])

# endpoint GET /api/templates to list/filter templates based on 3 optional query params
@router.get("", response_model=TemplateListResponse)
def list_templates(
    industry: str = Query(default=None),
    job_title: str = Query(default=None),
    seniority_level: str = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Template).filter(Template.status == "active")

    if industry:
        query = query.filter(Template.industry.ilike(f"%{industry}%"))
    if job_title:
        query = query.filter(Template.job_title.ilike(f"%{job_title}%"))
    if seniority_level:
        query = query.filter(Template.seniority_level == seniority_level)
    
    templates = query.all()
    return TemplateListResponse(templates=templates, total=len(templates))

# endpoint GET /api/templates/{template_id} to get a single template by ID
@router.get("/{template_id}", response_model=TemplateResponse)
def get_templates(template_id: UUID, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

