from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional, List
import os
from datetime import datetime, timedelta
import random
import string

from database import engine, get_db, Base
from models import User, Report, ReportStatus, ReportType
from schemas import (
    UserCreate, UserLogin, UserResponse,
    ReportCreate, ReportResponse, ReportUpdate,
    Token, PhoneVerificationRequest, VerificationResponse
)
from auth import (
    get_password_hash, verify_password,
    create_access_token, get_current_user, get_current_admin
)

# Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OYUN - Карта Наркоситуаций API")

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создание директории для загрузки файлов
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ==================== AUTH ENDPOINTS ====================

def generate_verification_code() -> str:
    """Генерация 6-значного кода верификации"""
    return ''.join(random.choices(string.digits, k=6))


@app.post("/api/auth/send-code", response_model=VerificationResponse)
def send_verification_code(request: PhoneVerificationRequest, db: Session = Depends(get_db)):
    """Отправка кода верификации на телефон (ДЕМО версия)"""
    # В реальном приложении здесь будет интеграция с SMS-сервисом
    
    code = generate_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=10)
    
    # Проверяем, существует ли пользователь с таким номером
    user = db.query(User).filter(User.phone_number == request.phone_number).first()
    
    if user:
        # Если пользователь уже верифицирован, не даем повторно зарегистрироваться
        if user.is_phone_verified:
            raise HTTPException(status_code=400, detail="Номер телефона уже зарегистрирован")
        
        # Обновляем код для существующего пользователя
        user.verification_code = code
        user.verification_code_expires = expires
    else:
        # Создаем временную запись пользователя
        user = User(
            phone_number=request.phone_number,
            username="temp",  # Будет обновлено при регистрации
            hashed_password="temp",  # Будет обновлено при регистрации
            is_phone_verified=False,
            verification_code=code,
            verification_code_expires=expires
        )
        db.add(user)
    
    db.commit()
    
    # ДЕМО: возвращаем код в ответе (в реальном приложении только отправляем SMS!)
    print(f"📱 ДЕМО SMS: Код верификации для {request.phone_number}: {code}")
    
    return {
        "message": f"Код отправлен на номер {request.phone_number}",
        "code": code  # ⚠️ Только для демо! В продакшене убрать!
    }


@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя с верификацией телефона"""
    # Проверяем, существует ли пользователь
    db_user = db.query(User).filter(User.phone_number == user.phone_number).first()
    
    if db_user and db_user.is_phone_verified:
        raise HTTPException(status_code=400, detail="Номер телефона уже зарегистрирован")
    
    # Проверяем код верификации
    if db_user:
        if not db_user.verification_code or db_user.verification_code != user.verification_code:
            raise HTTPException(status_code=400, detail="Неверный код верификации")
        
        if db_user.verification_code_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Код верификации истек")
        
        # Обновляем существующего пользователя
        db_user.username = user.username
        db_user.hashed_password = get_password_hash(user.password)
        db_user.is_phone_verified = True
        db_user.verification_code = None
        db_user.verification_code_expires = None
        db.commit()
        db.refresh(db_user)
        return db_user
    
    # Если пользователя нет, создаем нового
    # (но сначала должен быть вызван send-code)
    raise HTTPException(status_code=400, detail="Сначала запросите код верификации")


@app.post("/api/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Вход пользователя"""
    db_user = db.query(User).filter(User.phone_number == user.phone_number).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный номер телефона или пароль")
    
    if not db_user.is_phone_verified:
        raise HTTPException(status_code=401, detail="Телефон не верифицирован")
    
    access_token = create_access_token(data={"sub": db_user.phone_number})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Получение информации о текущем пользователе"""
    return current_user


# ==================== REPORT ENDPOINTS ====================

@app.post("/api/reports", response_model=ReportResponse)
async def create_report(
    report_type: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(...),
    description: str = Form(...),
    incident_date: Optional[str] = Form(None),
    kuy_number: Optional[str] = Form(None),
    erdr_number: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Создание нового обращения (доступно всем, включая неавторизованных)"""
    
    photo_url = None
    if photo:
        # Сохранение фото
        file_extension = photo.filename.split(".")[-1]
        filename = f"{datetime.now().timestamp()}_{photo.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            content = await photo.read()
            buffer.write(content)
        
        photo_url = f"/uploads/{filename}"
    
    new_report = Report(
        report_type=ReportType(report_type),
        latitude=latitude,
        longitude=longitude,
        address=address,
        description=description,
        incident_date=incident_date,
        kuy_number=kuy_number,
        erdr_number=erdr_number,
        photo_url=photo_url,
        user_id=current_user.id if current_user else None,
        status=ReportStatus.NEW
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report


@app.get("/api/reports", response_model=List[ReportResponse])
def get_reports(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение всех отчетов (только подтвержденные для публичного просмотра)"""
    query = db.query(Report)
    
    if status:
        query = query.filter(Report.status == ReportStatus(status))
    else:
        # По умолчанию показываем только подтвержденные
        query = query.filter(Report.status == ReportStatus.CONFIRMED)
    
    return query.all()


@app.get("/api/reports/my", response_model=List[ReportResponse])
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение обращений текущего пользователя"""
    return db.query(Report).filter(Report.user_id == current_user.id).all()


@app.get("/api/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    """Получение конкретного отчета"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    return report


# ==================== ADMIN ENDPOINTS ====================

@app.get("/api/admin/reports", response_model=List[ReportResponse])
def get_all_reports_admin(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение всех обращений для админа"""
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == ReportStatus(status))
    return query.all()


@app.get("/api/admin/reports/{report_id}", response_model=ReportResponse)
def get_report_admin(
    report_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение конкретного обращения для админа"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    return report


@app.patch("/api/admin/reports/{report_id}", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    report_update: ReportUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Обновление статуса обращения (только для админов)"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    
    if report_update.status:
        report.status = ReportStatus(report_update.status)
    
    if report_update.admin_notes:
        report.admin_notes = report_update.admin_notes
    
    report.reviewed_at = datetime.utcnow()
    report.reviewed_by = current_user.id
    
    db.commit()
    db.refresh(report)
    return report


@app.delete("/api/admin/reports/{report_id}")
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Удаление обращения (только для админов)"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    
    db.delete(report)
    db.commit()
    return {"message": "Обращение удалено"}


@app.get("/api/admin/stats")
def get_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение статистики (только для админов)"""
    total_reports = db.query(Report).count()
    new_reports = db.query(Report).filter(Report.status == ReportStatus.NEW).count()
    confirmed_reports = db.query(Report).filter(Report.status == ReportStatus.CONFIRMED).count()
    rejected_reports = db.query(Report).filter(Report.status == ReportStatus.REJECTED).count()
    
    return {
        "total_reports": total_reports,
        "new_reports": new_reports,
        "confirmed_reports": confirmed_reports,
        "rejected_reports": rejected_reports
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)