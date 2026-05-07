import re
from datetime import datetime

from pydantic import field_validator

from app.models.enums import UserRole
from app.schemas.base import ORMBaseSchema, TimestampedSchema

_SPECIAL_CHARS = re.compile(r"[!@#$%^&*()\-_=+\[\]{};:'\",.<>?/\\|`~]")


class UserBase(ORMBaseSchema):
    email: str
    full_name: str | None = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.JOBSEEKER

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number.")
        if not _SPECIAL_CHARS.search(v):
            raise ValueError("Password must contain at least one special character.")
        return v


class UserRead(UserBase, TimestampedSchema):
    id: str
    last_login_at: datetime | None = None
    role: UserRole = UserRole.JOBSEEKER
    is_email_verified: bool = False
