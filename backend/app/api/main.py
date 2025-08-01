from fastapi import APIRouter

from app.api.routes import challenges, items, login, private, questions, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(challenges.router, prefix="/challenges", tags=["challenges"])
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
