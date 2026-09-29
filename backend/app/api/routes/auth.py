import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import User
from app.schemas import AuthTokenResponse, LoginRequest, RegisterRequest, UserPublic
from app.services.auth import (
    TOKEN_TYPE,
    create_access_token,
    hash_password,
    normalize_email,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_PASSWORD_LETTER = re.compile(r"[A-Za-z]")
_PASSWORD_DIGIT = re.compile(r"\d")


def _validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")
    if not _PASSWORD_LETTER.search(password) or not _PASSWORD_DIGIT.search(password):
        raise HTTPException(
            status_code=422,
            detail="Password must include at least one letter and one number.",
        )


def _user_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
    )


def _token_response(settings: Settings, user: User) -> AuthTokenResponse:
    access_token = create_access_token(settings, user.id)
    return AuthTokenResponse(
        access_token=access_token,
        token_type=TOKEN_TYPE,
        user=_user_public(user),
    )


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)) -> AuthTokenResponse:
    _validate_password_strength(body.password)
    email = normalize_email(body.email)

    user = User(
        email=email,
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip() if body.full_name else None,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from exc
    db.refresh(user)
    return _token_response(settings, user)


@router.post("/login", response_model=AuthTokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)) -> AuthTokenResponse:
    email = normalize_email(body.email)
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return _token_response(settings, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> None:
    """Stateless JWT logout — client must discard the token."""
    return None


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return _user_public(current_user)
