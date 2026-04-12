from datetime import datetime

from app.models.enums import UserRole
from app.schemas.base import ORMBaseSchema, TimestampedSchema


class UserBase(ORMBaseSchema):
    email: str
    full_name: str | None = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.JOBSEEKER


class UserRead(UserBase, TimestampedSchema):
    id: str
    last_login_at: datetime | None = None
    role: UserRole = UserRole.JOBSEEKER
