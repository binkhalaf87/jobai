from app.schemas.base import ORMBaseSchema
from app.schemas.user import UserRead


class LoginRequest(ORMBaseSchema):
    email: str
    password: str


class AuthResponse(ORMBaseSchema):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserRead


class RefreshRequest(ORMBaseSchema):
    refresh_token: str
