from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class ReporteCYRBase(BaseModel):
    fecha_operacional: date

class ReporteCYRCreate(ReporteCYRBase):
    pass

class ReporteCYR(ReporteCYRBase):
    id: int
    estado: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
