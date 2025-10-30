from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ==================== USER SCHEMAS ====================

class PhoneVerificationRequest(BaseModel):
    """Схема запроса верификации телефона"""
    phone_number: str


class PhoneVerificationConfirm(BaseModel):
    """Схема подтверждения верификации телефона"""
    phone_number: str
    code: str


class UserCreate(BaseModel):
    """Схема создания пользователя"""
    phone_number: str
    username: str
    password: str
    verification_code: str


class UserLogin(BaseModel):
    """Схема входа пользователя"""
    phone_number: str
    password: str


class UserResponse(BaseModel):
    """Схема ответа пользователя"""
    id: int
    phone_number: str
    username: str
    is_admin: bool
    is_phone_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Схема токена"""
    access_token: str
    token_type: str


class VerificationResponse(BaseModel):
    """Схема ответа верификации (для демо)"""
    message: str
    code: str  # В реальном приложении не возвращайте код!


# ==================== REPORT SCHEMAS ====================

class ReportCreate(BaseModel):
    """Схема создания обращения"""
    report_type: str
    latitude: float
    longitude: float
    address: str
    description: str
    incident_date: Optional[str] = None
    kuy_number: Optional[str] = None
    erdr_number: Optional[str] = None


class ReportUpdate(BaseModel):
    """Схема обновления обращения (для админа)"""
    status: Optional[str] = None
    admin_notes: Optional[str] = None


class ReportResponse(BaseModel):
    """Схема ответа обращения"""
    id: int
    report_type: str
    status: str
    latitude: float
    longitude: float
    address: str
    description: str
    incident_date: Optional[str] = None
    kuy_number: Optional[str] = None
    erdr_number: Optional[str] = None
    photo_url: Optional[str] = None
    user_id: Optional[int] = None
    admin_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True