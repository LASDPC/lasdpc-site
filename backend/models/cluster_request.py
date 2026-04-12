from typing import Optional
from pydantic import BaseModel


class ClusterRequestCreate(BaseModel):
    cluster_id: str
    start_date: str          # ISO date string
    end_date: str            # ISO date string
    observation: str = ""
    custom_field_values: dict = {}  # {field_name: value}


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
    custom_field_values: dict = {}
    custom_field_defs: list[dict] = []  # snapshot of field definitions at request time
    status: str = "pending"  # pending | approved | rejected
    created_at: str
