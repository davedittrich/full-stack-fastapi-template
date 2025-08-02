"""
Question API routes.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select
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
    UserRole,
    Message,
)

router = APIRouter()


def require_proctor_or_above(current_user: User = Depends(deps.get_current_user)) -> User:
    """Require proctor, lecturer, or admin role."""
    if current_user.role not in [UserRole.PROCTOR, UserRole.LECTURER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only proctors, lecturers, and admins can perform this action"
        )
    return current_user


def require_lecturer_or_admin(current_user: User = Depends(deps.get_current_user)) -> User:
    """Require lecturer or admin role."""
    if current_user.role not in [UserRole.LECTURER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only lecturers and admins can perform this action"
        )
    return current_user


@router.get("/", response_model=QuestionsPublic)
def read_questions(
    *,
    session: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    challenge_id: str | None = None,
) -> Any:
    """
    Retrieve questions (help requests).
    Students see only their own questions.
    Proctors, lecturers, and admins see all questions.
    """
    count_statement = select(func.count()).select_from(Question)
    statement = select(Question).offset(skip).limit(limit)

    # Filter by challenge if specified
    if challenge_id:
        count_statement = count_statement.where(Question.challenge_id == challenge_id)
        statement = statement.where(Question.challenge_id == challenge_id)

    # Students can only see their own questions
    if current_user.role == UserRole.STUDENT:
        count_statement = count_statement.where(Question.asked_by == current_user.id)
        statement = statement.where(Question.asked_by == current_user.id)

    count = session.exec(count_statement).one()
    questions = session.exec(statement).all()

    return QuestionsPublic(data=questions, count=count)


@router.post("/", response_model=QuestionPublic)
def create_question(
    *,
    session: Session = Depends(deps.get_db),
    question_in: QuestionCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new question (help request).
    All users can create questions, but they are automatically assigned as the asker.
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
    Update a question (help request).
    Students can only update their own questions.
    Proctors, lecturers, and admins can update any question.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check permissions: students can only edit their own questions
    if current_user.role == UserRole.STUDENT and question.asked_by != current_user.id:
        raise HTTPException(status_code=403, detail="Students can only update their own questions")

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
    Students can only view their own questions.
    Proctors, lecturers, and admins can view any question.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check permissions: students can only view their own questions
    if current_user.role == UserRole.STUDENT and question.asked_by != current_user.id:
        raise HTTPException(status_code=403, detail="Students can only view their own questions")

    return question


@router.delete("/{id}")
def delete_question(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Message:
    """
    Delete a question (help request).
    Students can only delete their own questions.
    Lecturers and admins can delete any question.
    Proctors cannot delete questions.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check permissions
    if current_user.role == UserRole.STUDENT and question.asked_by != current_user.id:
        raise HTTPException(status_code=403, detail="Students can only delete their own questions")
    elif current_user.role == UserRole.PROCTOR:
        raise HTTPException(status_code=403, detail="Proctors cannot delete questions")
    elif current_user.role not in [UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    question = crud.delete_question(session=session, id=uuid.UUID(id))
    return Message(message="Question deleted successfully")


@router.put("/{id}/assign", response_model=QuestionPublic)
def assign_question(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    assigned_to_id: str,
    current_user: User = Depends(require_proctor_or_above),
) -> Any:
    """
    Assign question (help request) to a proctor or lecturer.
    Only proctors, lecturers, and admins can assign questions.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Verify assigned user exists and has appropriate role
    assigned_user = crud.get_user(session=session, id=uuid.UUID(assigned_to_id))
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    if assigned_user.role not in [UserRole.PROCTOR, UserRole.LECTURER, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Questions can only be assigned to proctors, lecturers, or admins")

    question = crud.assign_question(session=session, db_question=question, assigned_to=uuid.UUID(assigned_to_id))
    return question


@router.put("/{id}/answer", response_model=QuestionPublic)
def answer_question(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    answer_text: str,
    current_user: User = Depends(require_proctor_or_above),
) -> Any:
    """
    Answer a question (provide help to student).
    Only proctors, lecturers, and admins can answer questions.
    """
    question = crud.get_question(session=session, id=uuid.UUID(id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Update the question with answer information
    question_update = QuestionUpdate(
        more_info=answer_text,
        assigned_to=current_user.id,
    )

    question = crud.update_question(session=session, db_question=question, question_in=question_update)
    # Mark as answered
    question = crud.answer_question(session=session, db_question=question)
    return question


@router.get("/assigned-to-me", response_model=QuestionsPublic)
def read_assigned_questions(
    *,
    session: Session = Depends(deps.get_db),
    current_user: User = Depends(require_proctor_or_above),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get questions assigned to current user.
    Only proctors, lecturers, and admins can use this endpoint.
    """
    count_statement = select(func.count()).select_from(Question).where(Question.assigned_to == current_user.id)
    statement = select(Question).where(Question.assigned_to == current_user.id).offset(skip).limit(limit)

    count = session.exec(count_statement).one()
    questions = session.exec(statement).all()

    return QuestionsPublic(data=questions, count=count)
