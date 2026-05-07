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


class RegisterResponse(ORMBaseSchema):
    message: str


class RefreshRequest(ORMBaseSchema):
    refresh_token: str | None = None


class LogoutRequest(ORMBaseSchema):
    refresh_token: str | None = None
    access_token: str | None = None


class VerifyEmailRequest(ORMBaseSchema):
    token: str


class ResendVerificationRequest(ORMBaseSchema):
    email: str


class ForgotPasswordRequest(ORMBaseSchema):
    email: str


class ResetPasswordRequest(ORMBaseSchema):
    token: str
    new_password: str
