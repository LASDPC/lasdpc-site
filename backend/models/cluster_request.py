from typing import Optional
from pydantic import BaseModel, Field


class ClusterRequestCreate(BaseModel):
    cluster_id: str
    start_date: str          # ISO date string
    end_date: str            # ISO date string
    observation: str = ""
    custom_field_values: dict = Field(default_factory=dict)  # {field_name: value}


class ClusterRequestApprove(BaseModel):
    access_key: Optional[str] = None
    access_starts_at: Optional[str] = None
    access_ends_at: Optional[str] = None


class ClusterRequestOut(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    cluster_id: str
    cluster_name: str
    start_date: str
    end_date: str
    observation: str = ""
    custom_field_values: dict = Field(default_factory=dict)
    custom_field_defs: list[dict] = Field(default_factory=list)  # snapshot of field definitions at request time
    status: str = "pending"  # pending | approved | rejected | expired | revoked
    created_at: str
    pre_reservation_expires_at: Optional[str] = None
    resolved_at: Optional[str] = None
    approved_at: Optional[str] = None
    access_key: Optional[str] = None
    access_starts_at: Optional[str] = None
    access_ends_at: Optional[str] = None
    access_revoked_at: Optional[str] = None


class ClusterUsageOut(BaseModel):
    id: str
    cluster_id: str
    cluster_name: str
    user_name: str
    start_date: str
    end_date: str
    status: str
    access_starts_at: Optional[str] = None
    access_ends_at: Optional[str] = None
