from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


class ReportStatus(enum.Enum):
    """Статусы обращения"""
    NEW = "new"  # Новый
    CONFIRMED = "confirmed"  # Подтвержден
    REJECTED = "rejected"  # Отклонен


class ReportType(enum.Enum):
    """Типы обращений"""
    DRUG_DEALER = "drug_dealer"  # Наркозакладчики (синий)
    DRUG_GRAFFITI = "drug_graffiti"  # Наркограффити (желтый)
    DRUG_DEN = "drug_den"  # Наркопритон (красный)
    DRUG_ADDICT = "drug_addict"  # Проживание наркозависимых
    OVERDOSE = "overdose"  # Передозировка
    OTHER = "other"  # Иные сведения


class User(Base):
    """Модель пользователя"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    reports = relationship("Report", back_populates="user", foreign_keys="Report.user_id")
    reviewed_reports = relationship("Report", back_populates="reviewer", foreign_keys="Report.reviewed_by")


class Report(Base):
    """Модель обращения"""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    
    # Тип и статус
    report_type = Column(SQLEnum(ReportType), nullable=False)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.NEW)
    
    # Геолокация
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    
    # Описание
    description = Column(String, nullable=False)
    incident_date = Column(String, nullable=True)  # Дата и время инцидента
    
    # Номера дел (опционально)
    kuy_number = Column(String, nullable=True)  # Номер КУИ
    erdr_number = Column(String, nullable=True)  # Номер ЕРДР
    
    # Фото
    photo_url = Column(String, nullable=True)
    
    # Пользователь (может быть null для неавторизованных)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Админ данные
    admin_notes = Column(String, nullable=True)  # Заметки админа
    reviewed_at = Column(DateTime, nullable=True)  # Дата проверки
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Кто проверил
    
    # Временные метки
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    user = relationship("User", back_populates="reports", foreign_keys=[user_id])
    reviewer = relationship("User", back_populates="reviewed_reports", foreign_keys=[reviewed_by])