import uuid
from datetime import datetime
from enum import Enum

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Role-based access control
class UserRole(str, Enum):
    STUDENT = "student"
    PROCTOR = "proctor"
    LECTURER = "lecturer"
    ADMIN = "admin"


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = Field(default=UserRole.STUDENT)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    challenges: list["Challenge"] = Relationship(back_populates="owner", cascade_delete=True)
    assessments: list["Assessment"] = Relationship(back_populates="owner", cascade_delete=True)
    questions_asked: list["Question"] = Relationship(back_populates="asked_by_user", cascade_delete=True, sa_relationship_kwargs={"foreign_keys": "[Question.asked_by]"})
    questions_assigned: list["Question"] = Relationship(back_populates="assigned_to_user", cascade_delete=True, sa_relationship_kwargs={"foreign_keys": "[Question.assigned_to]"})


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Challenge models
# Shared properties
class ChallengeBase(SQLModel):
    title: str = Field(min_length=1, max_length=100, unique=True, index=True)
    author: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=256)
    description: str = Field(min_length=1, max_length=1024)
    date_posted: str = Field(min_length=1, max_length=10)
    is_active: bool = True


# Properties to receive on challenge creation
class ChallengeCreate(ChallengeBase):
    pass


# Properties to receive on challenge update
class ChallengeUpdate(ChallengeBase):
    title: str | None = Field(default=None, min_length=1, max_length=100)  # type: ignore
    author: str | None = Field(default=None, min_length=1, max_length=100)
    url: str | None = Field(default=None, min_length=1, max_length=256)
    description: str | None = Field(default=None, min_length=1, max_length=1024)
    date_posted: str | None = Field(default=None, min_length=1, max_length=10)
    is_active: bool | None = None


# Database model, database table inferred from class name
class Challenge(ChallengeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="challenges")
    questions: list["Question"] = Relationship(back_populates="challenge", cascade_delete=True)
    assessments: list["Assessment"] = Relationship(back_populates="challenge", cascade_delete=True)


# Properties to return via API, id is always required
class ChallengePublic(ChallengeBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ChallengesPublic(SQLModel):
    data: list[ChallengePublic]
    count: int


# Question models
# Shared properties
class QuestionBase(SQLModel):
    type: str = Field(default="general", max_length=80)
    step: int | None = None
    subject: str = Field(min_length=1)
    description: str = Field(min_length=1)
    more_info: str = Field(min_length=1)


# Properties to receive on question creation
class QuestionCreate(QuestionBase):
    challenge_id: uuid.UUID


# Properties to receive on question update
class QuestionUpdate(QuestionBase):
    challenge_id: uuid.UUID | None = None
    type: str | None = Field(default=None, max_length=80)
    subject: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, min_length=1)
    more_info: str | None = Field(default=None, min_length=1)


# Database model, database table inferred from class name
class Question(QuestionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    challenge_id: uuid.UUID = Field(
        foreign_key="challenge.id", nullable=False, ondelete="CASCADE"
    )
    asked_by: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)
    asked_time: datetime = Field(default_factory=datetime.utcnow)
    assigned_to: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)
    answered_time: datetime | None = None

    challenge: Challenge | None = Relationship(back_populates="questions")
    asked_by_user: User | None = Relationship(back_populates="questions_asked", sa_relationship_kwargs={"foreign_keys": "[Question.asked_by]"})
    assigned_to_user: User | None = Relationship(back_populates="questions_assigned", sa_relationship_kwargs={"foreign_keys": "[Question.assigned_to]"})


# Properties to return via API, id is always required
class QuestionPublic(QuestionBase):
    id: uuid.UUID
    challenge_id: uuid.UUID
    asked_by: uuid.UUID | None
    asked_time: datetime
    assigned_to: uuid.UUID | None
    answered_time: datetime | None


class QuestionsPublic(SQLModel):
    data: list[QuestionPublic]
    count: int


# Assessment model for quiz-style questions with scoring
# Shared properties
class AssessmentBase(SQLModel):
    question_text: str = Field(min_length=1, max_length=1024)
    question_type: str = Field(default="short_answer", max_length=50)
    points: int = Field(default=10, ge=1, le=1000)
    answer_text: str | None = Field(default=None, max_length=2048)
    hint_text: str | None = Field(default=None, max_length=1024)
    flag_format: str | None = Field(default=None, max_length=255)
    difficulty: str = Field(default="medium", max_length=20)  # easy, medium, hard
    is_active: bool = Field(default=True)


# Properties to receive on assessment creation
class AssessmentCreate(AssessmentBase):
    challenge_id: uuid.UUID


# Properties to receive on assessment update
class AssessmentUpdate(AssessmentBase):
    challenge_id: uuid.UUID | None = None
    question_text: str | None = Field(default=None, min_length=1, max_length=1024)
    question_type: str | None = Field(default=None, max_length=50)
    points: int | None = Field(default=None, ge=1, le=1000)
    answer_text: str | None = Field(default=None, max_length=2048)
    hint_text: str | None = Field(default=None, max_length=1024)
    flag_format: str | None = Field(default=None, max_length=255)
    difficulty: str | None = Field(default=None, max_length=20)
    is_active: bool | None = None


# Database model, database table inferred from class name
class Assessment(AssessmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    challenge_id: uuid.UUID = Field(
        foreign_key="challenge.id", nullable=False, ondelete="CASCADE"
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    challenge: Challenge | None = Relationship(back_populates="assessments")
    owner: User | None = Relationship(back_populates="assessments")


# Properties to return via API, id is always required
class AssessmentPublic(AssessmentBase):
    id: uuid.UUID
    challenge_id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    challenge: Challenge | None = None


class AssessmentsPublic(SQLModel):
    data: list[AssessmentPublic]
    count: int


# FAQ model
# Shared properties
class FAQBase(SQLModel):
    type: str = Field(default="general", max_length=80)
    subject: str = Field(min_length=1)
    description: str = Field(min_length=1)
    more_info: str | None = Field(default=None, max_length=256)


# Properties to receive on FAQ creation
class FAQCreate(FAQBase):
    pass


# Properties to receive on FAQ update
class FAQUpdate(FAQBase):
    type: str | None = Field(default=None, max_length=80)
    subject: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, min_length=1)
    more_info: str | None = Field(default=None, max_length=256)


# Database model, database table inferred from class name
class FAQ(FAQBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


# Properties to return via API, id is always required
class FAQPublic(FAQBase):
    id: uuid.UUID


class FAQsPublic(SQLModel):
    data: list[FAQPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
