from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Skill
from schemas import SkillSearchResponse

router = APIRouter(prefix="/api/skills", tags=["Skills"]) # create a router

# Create an endpoint GET /api/skills?q=<search term>
@router.get("", response_model=SkillSearchResponse)
def search_skills(q: str = Query(default=""), db: Session = Depends(get_db)):
    query = db.query(Skill).filter(Skill.status == "active")
    if q:
        query = query.filter(Skill.skill_name.ilike(f"%{q}%"))
    skills = query.limit(20).all()
    return SkillSearchResponse(skills=skills)
