"""
Question API routes.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.api import deps
from app.models import (
    Question,
    QuestionCreate,
    QuestionPublic,
    QuestionsPublic,
    QuestionUpdate,
    User,
)

router = APIRouter()


@router.get("/", response_model=QuestionsPublic)
def read_questions(
    session: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    challenge_id: str = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve questions.
    """
    if challenge_id:
        questions = crud.get_questions_by_challenge(session=session, challenge_id=uuid.UUID(challenge_id), skip=skip, limit=limit)
    else:
        questions = crud.get_questions(session=session, skip=skip, limit=limit)
    return QuestionsPublic(data=questions, count=len(questions))


@router.post("/", response_model=QuestionPublic)
def create_question(
    *,
    session: Session = Depends(deps.get_db),
    question_in: QuestionCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new question.
    """
    # Verify challenge exists
    challenge = crud.get_challenge(session=session, id=question_in.challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    question = crud.create_question(
        session=session, question_in=question_in, asked_by=current_user.id
    )
    return question


@router.put("/{id}", response_model=QuestionPublic)
def update_question(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    question_in: QuestionUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a question.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if not current_user.is_superuser and (question.asked_by != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    question = crud.update_question(session=session, db_question=question, question_in=question_in)
    return question


@router.get("/{id}", response_model=QuestionPublic)
def read_question(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get question by ID.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.delete("/{id}")
def delete_question(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a question.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if not current_user.is_superuser and (question.asked_by != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    question = crud.delete_question(session=session, id=uuid.UUID(id))
    return {"message": "Question deleted successfully"}


@router.put("/{id}/assign", response_model=QuestionPublic)
def assign_question(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    assigned_to: str,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Assign question to user.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Verify assigned user exists
    assigned_user = crud.get_user_by_email(session=session, email=assigned_to)
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    question = crud.assign_question(session=session, db_question=question, assigned_to=uuid.UUID(assigned_to))
    return question
