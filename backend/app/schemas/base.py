from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMBaseSchema(BaseModel):
    """Base schema configuration for ORM-backed API models."""

    model_config = ConfigDict(from_attributes=True)


class TimestampedSchema(ORMBaseSchema):
    """Reusable timestamp fields exposed by mutable entities."""

    created_at: datetime
    updated_at: datetime

