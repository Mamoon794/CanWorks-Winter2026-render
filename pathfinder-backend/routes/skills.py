from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Skill
from schemas import SkillSearchResponse, SkillResponse, SkillCreate

router = APIRouter(prefix="/api/skills", tags=["Skills"]) # create a router

# Create an endpoint GET /api/skills?q=<search term>
@router.get("", response_model=SkillSearchResponse)
def search_skills(q: str = Query(default=""), db: Session = Depends(get_db)):
    query = db.query(Skill).filter(Skill.status == "active")
    if q:
        query = query.filter(Skill.skill_name.ilike(f"%{q}%"))
    skills = query.limit(20).all()
    return SkillSearchResponse(skills=skills)


@router.post("", response_model=SkillResponse)
def create_skill(data: SkillCreate, db: Session = Depends(get_db)):
    existing = db.query(Skill).filter(
        Skill.skill_name.ilike(data.skill_name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Skill already exists")

    skill = Skill(
        skill_name=data.skill_name.strip(),
        skill_category=data.skill_category or "Custom"
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill
