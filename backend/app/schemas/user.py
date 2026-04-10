from datetime import datetime

from app.schemas.base import ORMBaseSchema, TimestampedSchema


class UserBase(ORMBaseSchema):
    email: str
    full_name: str | None = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserRead(UserBase, TimestampedSchema):
    id: str
    last_login_at: datetime | None = None
