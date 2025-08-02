"""
Assessment API routes for quiz-style questions with scoring.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api import deps
from app.core.db import Session
from app.models import (
    Assessment,
    AssessmentCreate,
    AssessmentPublic,
    AssessmentsPublic,
    AssessmentUpdate,
    Challenge,
    Message,
    User,
    UserRole,
)

router = APIRouter()


def require_lecturer_or_admin(current_user: User = Depends(deps.get_current_user)) -> User:
    """Require lecturer or admin role."""
    if current_user.role not in [UserRole.LECTURER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only lecturers and admins can manage assessments"
        )
    return current_user


@router.get("/", response_model=AssessmentsPublic)
def read_assessments(
    *,
    session: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    challenge_id: str | None = None,
) -> Any:
    """
    Retrieve assessments.
    Students see only active assessments without answers.
    Lecturers and admins see all assessments with full details.
    """
    count_statement = select(func.count()).select_from(Assessment)
    if challenge_id:
        count_statement = count_statement.where(Assessment.challenge_id == challenge_id)

    # Students can only see active assessments
    if current_user.role == UserRole.STUDENT:
        count_statement = count_statement.where(Assessment.is_active == True)

    count = session.exec(count_statement).one()

    statement = select(Assessment).offset(skip).limit(limit)
    if challenge_id:
        statement = statement.where(Assessment.challenge_id == challenge_id)

    # Students can only see active assessments
    if current_user.role == UserRole.STUDENT:
        statement = statement.where(Assessment.is_active == True)

    assessments = session.exec(statement).all()

    # For students, hide sensitive information
    assessment_data = []
    for assessment in assessments:
        assessment_dict = assessment.model_dump()
        if current_user.role == UserRole.STUDENT:
            # Hide answers and hints from students
            assessment_dict.pop("answer_text", None)
            assessment_dict.pop("hint_text", None)
        assessment_data.append(AssessmentPublic(**assessment_dict))

    return AssessmentsPublic(data=assessment_data, count=count)


@router.post("/", response_model=AssessmentPublic)
def create_assessment(
    *,
    session: Session = Depends(deps.get_db),
    assessment_in: AssessmentCreate,
    current_user: User = Depends(require_lecturer_or_admin),
) -> Any:
    """
    Create new assessment.
    Only lecturers and admins can create assessments.
    """
    # Verify challenge exists
    challenge = session.get(Challenge, assessment_in.challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    assessment = Assessment.model_validate(
        assessment_in, update={"owner_id": current_user.id}
    )
    session.add(assessment)
    session.commit()
    session.refresh(assessment)
    return assessment


@router.get("/{id}", response_model=AssessmentPublic)
def read_assessment(
    *,
    session: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    id: str,
) -> Any:
    """
    Get assessment by ID.
    Students see only active assessments without answers.
    """
    assessment = session.get(Assessment, id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Students can only see active assessments
    if current_user.role == UserRole.STUDENT and not assessment.is_active:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # For students, hide sensitive information
    if current_user.role == UserRole.STUDENT:
        assessment_dict = assessment.model_dump()
        assessment_dict.pop("answer_text", None)
        assessment_dict.pop("hint_text", None)
        return AssessmentPublic(**assessment_dict)

    return assessment


@router.put("/{id}", response_model=AssessmentPublic)
def update_assessment(
    *,
    session: Session = Depends(deps.get_db),
    current_user: User = Depends(require_lecturer_or_admin),
    id: str,
    assessment_in: AssessmentUpdate,
) -> Any:
    """
    Update an assessment.
    Only lecturers and admins can update assessments.
    """
    assessment = session.get(Assessment, id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment_data = assessment_in.model_dump(exclude_unset=True)
    assessment.sqlmodel_update(assessment_data)
    session.add(assessment)
    session.commit()
    session.refresh(assessment)
    return assessment


@router.delete("/{id}")
def delete_assessment(
    *,
    session: Session = Depends(deps.get_db),
    current_user: User = Depends(require_lecturer_or_admin),
    id: str,
) -> Message:
    """
    Delete an assessment.
    Only lecturers and admins can delete assessments.
    """
    assessment = session.get(Assessment, id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    session.delete(assessment)
    session.commit()
    return Message(message="Assessment deleted successfully")


@router.get("/{id}/hint", response_model=dict)
def get_assessment_hint(
    *,
    session: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    id: str,
) -> Any:
    """
    Get hint for an assessment.
    Only students can request hints for active assessments.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Only students can request hints"
        )

    assessment = session.get(Assessment, id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if not assessment.is_active:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return {"hint": assessment.hint_text or "No hint available for this assessment"}
