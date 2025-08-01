import uuid
from datetime import datetime
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Challenge,
    ChallengeCreate,
    ChallengeUpdate,
    Item,
    ItemCreate,
    Question,
    QuestionCreate,
    QuestionUpdate,
    User,
    UserCreate,
    UserUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


# Challenge CRUD operations
def create_challenge(*, session: Session, challenge_in: ChallengeCreate, owner_id: uuid.UUID) -> Challenge:
    db_challenge = Challenge.model_validate(challenge_in, update={"owner_id": owner_id})
    session.add(db_challenge)
    session.commit()
    session.refresh(db_challenge)
    return db_challenge


def get_challenge(*, session: Session, id: uuid.UUID) -> Challenge | None:
    statement = select(Challenge).where(Challenge.id == id)
    return session.exec(statement).first()


def get_challenges(*, session: Session, skip: int = 0, limit: int = 100) -> list[Challenge]:
    statement = select(Challenge).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_challenges_by_owner(*, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[Challenge]:
    statement = select(Challenge).where(Challenge.owner_id == owner_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_challenge(*, session: Session, db_challenge: Challenge, challenge_in: ChallengeUpdate) -> Challenge:
    challenge_data = challenge_in.model_dump(exclude_unset=True)
    db_challenge.sqlmodel_update(challenge_data)
    session.add(db_challenge)
    session.commit()
    session.refresh(db_challenge)
    return db_challenge


def delete_challenge(*, session: Session, id: uuid.UUID) -> Challenge | None:
    challenge = get_challenge(session=session, id=id)
    if challenge:
        session.delete(challenge)
        session.commit()
    return challenge


# Question CRUD operations
def create_question(*, session: Session, question_in: QuestionCreate, asked_by: uuid.UUID) -> Question:
    db_question = Question.model_validate(question_in, update={"asked_by": asked_by})
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


def get_question(*, session: Session, id: uuid.UUID) -> Question | None:
    statement = select(Question).where(Question.id == id)
    return session.exec(statement).first()


def get_questions(*, session: Session, skip: int = 0, limit: int = 100) -> list[Question]:
    statement = select(Question).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_questions_by_challenge(*, session: Session, challenge_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[Question]:
    statement = select(Question).where(Question.challenge_id == challenge_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_questions_by_user(*, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[Question]:
    statement = select(Question).where(Question.asked_by == user_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_question(*, session: Session, db_question: Question, question_in: QuestionUpdate) -> Question:
    question_data = question_in.model_dump(exclude_unset=True)
    db_question.sqlmodel_update(question_data)
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


def assign_question(*, session: Session, db_question: Question, assigned_to: uuid.UUID) -> Question:
    db_question.assigned_to = assigned_to
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


def answer_question(*, session: Session, db_question: Question) -> Question:
    db_question.answered_time = datetime.utcnow()
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


def delete_question(*, session: Session, id: uuid.UUID) -> Question | None:
    question = get_question(session=session, id=id)
    if question:
        session.delete(question)
        session.commit()
    return question
