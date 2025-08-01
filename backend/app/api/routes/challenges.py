"""
Challenge API routes.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.api import deps
from app.models import (
    Challenge,
    ChallengeCreate,
    ChallengePublic,
    ChallengesPublic,
    ChallengeUpdate,
    User,
)

router = APIRouter()


@router.get("/", response_model=ChallengesPublic)
def read_challenges(
    session: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve challenges.
    """
    challenges = crud.get_challenges(session=session, skip=skip, limit=limit)
    return ChallengesPublic(data=challenges, count=len(challenges))


@router.post("/", response_model=ChallengePublic)
def create_challenge(
    *,
    session: Session = Depends(deps.get_db),
    challenge_in: ChallengeCreate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new challenge.
    """
    challenge = crud.create_challenge(
        session=session, challenge_in=challenge_in, owner_id=current_user.id
    )
    return challenge


@router.put("/{id}", response_model=ChallengePublic)
def update_challenge(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    challenge_in: ChallengeUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update an challenge.
    """
    import uuid
    challenge = crud.get_challenge(session=session, id=uuid.UUID(id))
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not current_user.is_superuser and (challenge.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    challenge = crud.update_challenge(session=session, db_challenge=challenge, challenge_in=challenge_in)
    return challenge


@router.get("/{id}", response_model=ChallengePublic)
def read_challenge(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get challenge by ID.
    """
    import uuid
    challenge = crud.get_challenge(session=session, id=uuid.UUID(id))
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not current_user.is_superuser and (challenge.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return challenge


@router.delete("/{id}")
def delete_challenge(
    *,
    session: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete an challenge.
    """
    import uuid
    challenge = crud.get_challenge(session=session, id=uuid.UUID(id))
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not current_user.is_superuser and (challenge.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    challenge = crud.delete_challenge(session=session, id=uuid.UUID(id))
    return {"message": "Challenge deleted successfully"}