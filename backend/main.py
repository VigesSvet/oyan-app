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
from models import User, Report, ReportStatus, ReportType, News, BonusRedemption, BonusRedemptionStatus
from schemas import (
    UserCreate, UserLogin, UserResponse,
    ReportCreate, ReportResponse, ReportUpdate,
    Token, PhoneVerificationRequest, VerificationResponse,
    NewsCreate, NewsUpdate, NewsResponse,
    BonusRedemptionCreate, BonusRedemptionResponse,
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


# ==================== NEWS ENDPOINTS ====================

@app.get("/api/news", response_model=List[NewsResponse])
def get_public_news(db: Session = Depends(get_db)):
    """Получение всех опубликованных новостей для публичного просмотра"""
    news = db.query(News).filter(
        News.is_published == True
    ).order_by(News.published_at.desc()).all()
    return news


@app.get("/api/news/{news_id}", response_model=NewsResponse)
def get_news_detail(news_id: int, db: Session = Depends(get_db)):
    """Получение конкретной опубликованной новости"""
    news = db.query(News).filter(
        News.id == news_id,
        News.is_published == True
    ).first()
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    return news


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
    
    old_status = report.status
    
    if report_update.status:
        report.status = ReportStatus(report_update.status)
        
        # Начисляем бонусы если обращение подтверждено и это первое подтверждение
        if report.status == ReportStatus.CONFIRMED and old_status != ReportStatus.CONFIRMED:
            if report.user_id:
                user = db.query(User).filter(User.id == report.user_id).first()
                if user:
                    user.bonus_points += 10
                    db.add(user)
    
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


@app.get("/api/admin/analytics/by-date")
def get_analytics_by_date(
    period: str = "month",  # day, week, month
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение динамики обращений по датам"""
    from datetime import timedelta
    
    now = datetime.utcnow()
    
    if period == "day":
        start_date = now - timedelta(days=1)
        date_format = "%H:%M"
    elif period == "week":
        start_date = now - timedelta(days=7)
        date_format = "%a"
    else:  # month
        start_date = now - timedelta(days=30)
        date_format = "%d.%m"
    
    reports = db.query(Report).filter(Report.created_at >= start_date).all()
    
    # Группируем по датам
    date_groups = {}
    for report in reports:
        date_key = report.created_at.strftime(date_format)
        if date_key not in date_groups:
            date_groups[date_key] = {"date": date_key, "count": 0}
        date_groups[date_key]["count"] += 1
    
    # Сортируем по дате
    result = sorted(date_groups.values(), key=lambda x: x["date"])
    return result


@app.get("/api/admin/analytics/by-type")
def get_analytics_by_type(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение распределения обращений по типам (категориям)"""
    type_mapping = {
        "drug_dealer": {"name": "Наркозакладчики", "color": "#D4DFE8"},
        "drug_graffiti": {"name": "Наркограффити", "color": "#A8BFCE"},
        "drug_den": {"name": "Наркопритон", "color": "#6B95B3"},
        "drug_addict": {"name": "Проживание наркозависимых", "color": "#4A6B8A"},
        "overdose": {"name": "Передозировка", "color": "#2D4558"},
        "other": {"name": "Иные сведения", "color": "#1F3039"}
    }
    
    result = []
    for report_type in ReportType:
        count = db.query(Report).filter(Report.report_type == report_type).count()
        type_key = report_type.value
        type_info = type_mapping.get(type_key, {"name": type_key, "color": "#999"})
        
        result.append({
            "name": type_info["name"],
            "value": count,
            "color": type_info["color"],
            "type": type_key
        })
    
    return result


@app.get("/api/admin/analytics/by-district")
def get_analytics_by_district(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение распределения обращений по районам"""
    reports = db.query(Report).all()
    
    # Группируем по районам (извлекаем из адреса первые слова)
    district_groups = {}
    for report in reports:
        # Простой способ - берем первое слово из адреса как район
        # Можно улучшить в будущем с более сложной логикой парсинга
        parts = report.address.split(",")
        district = parts[-1].strip() if parts else "Неизвестный район"
        
        if district not in district_groups:
            district_groups[district] = {"district": district, "count": 0}
        district_groups[district]["count"] += 1
    
    result = sorted(district_groups.values(), key=lambda x: x["count"], reverse=True)[:10]
    return result


@app.get("/api/admin/analytics/by-status")
def get_analytics_by_status(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение распределения обращений по статусам"""
    status_mapping = {
        "new": {"name": "Новые", "color": "#A8BFCE"},
        "confirmed": {"name": "Верифицировано", "color": "#6B95B3"},
        "rejected": {"name": "Отклонено", "color": "#4A6B8A"}
    }
    
    result = []
    for status in ReportStatus:
        count = db.query(Report).filter(Report.status == status).count()
        status_key = status.value
        status_info = status_mapping.get(status_key, {"name": status_key, "color": "#999"})
        
        result.append({
            "name": status_info["name"],
            "value": count,
            "color": status_info["color"],
            "status": status_key
        })
    
    return result


# ==================== ADMIN NEWS ENDPOINTS ====================

@app.get("/api/admin/news", response_model=List[NewsResponse])
def get_all_news_admin(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение всех новостей для админа (опубликованные и черновики)"""
    news = db.query(News).order_by(News.created_at.desc()).all()
    return news


@app.post("/api/admin/news", response_model=NewsResponse)
def create_news(
    news_data: NewsCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Создание новой новости (только для админов)"""
    new_news = News(
        title=news_data.title,
        content=news_data.content,
        is_published=news_data.is_published,
        author_id=current_user.id,
        image_url=news_data.image_url,
        published_at=datetime.utcnow() if news_data.is_published else None
    )
    
    db.add(new_news)
    db.commit()
    db.refresh(new_news)
    return new_news


@app.put("/api/admin/news/{news_id}", response_model=NewsResponse)
def update_news(
    news_id: int,
    news_update: NewsUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Обновление новости (только для админов)"""
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    
    if news_update.title:
        news.title = news_update.title
    
    if news_update.content:
        news.content = news_update.content
    
    if news_update.image_url is not None:
        news.image_url = news_update.image_url
    
    if news_update.is_published is not None:
        news.is_published = news_update.is_published
        if news_update.is_published and not news.published_at:
            news.published_at = datetime.utcnow()
    
    news.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(news)
    return news


@app.delete("/api/admin/news/{news_id}")
def delete_news(
    news_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Удаление новости (только для админов)"""
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    
    db.delete(news)
    db.commit()
    return {"message": "Новость удалена"}


# ==================== BONUS ENDPOINTS ====================

@app.post("/api/bonuses/redeem", response_model=BonusRedemptionResponse)
def redeem_bonus(
    redemption: BonusRedemptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание заявки на награждение бонусами"""
    
    # Проверяем, есть ли достаточно бонусов
    if current_user.bonus_points < redemption.bonus_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Недостаточно бонусов. У вас {current_user.bonus_points} бонусов"
        )
    
    # Проверяем, что bonus_amount один из допустимых значений
    if redemption.bonus_amount not in [50, 100, 150]:
        raise HTTPException(
            status_code=400,
            detail="Можно потратить только 50, 100 или 150 бонусов"
        )
    
    # Создаем заявку на награждение
    bonus_redemption = BonusRedemption(
        user_id=current_user.id,
        bonus_amount=redemption.bonus_amount,
        reward_type=redemption.reward_type,
        user_email=current_user.phone_number,
        user_username=current_user.username,
        contact_info=redemption.contact_info,
        status=BonusRedemptionStatus.PENDING
    )
    
    # Вычитаем бонусы сразу
    current_user.bonus_points -= redemption.bonus_amount
    
    db.add(bonus_redemption)
    db.add(current_user)
    db.commit()
    db.refresh(bonus_redemption)
    
    return bonus_redemption


@app.get("/api/bonuses/redemptions", response_model=List[BonusRedemptionResponse])
def get_my_redemptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение своих заявок на награждение"""
    redemptions = db.query(BonusRedemption).filter(
        BonusRedemption.user_id == current_user.id
    ).order_by(BonusRedemption.created_at.desc()).all()
    return redemptions


@app.get("/api/bonuses/my", response_model=dict)
def get_my_bonus_info(
    current_user: User = Depends(get_current_user)
):
    """Получение информации о бонусах текущего пользователя"""
    return {
        "bonus_points": current_user.bonus_points,
        "user_id": current_user.id,
        "username": current_user.username
    }


# ==================== ADMIN BONUS ENDPOINTS ====================

@app.get("/api/admin/bonus-redemptions", response_model=List[BonusRedemptionResponse])
def get_all_redemptions(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Получение всех заявок на награждение (для админа)"""
    query = db.query(BonusRedemption)
    
    if status:
        query = query.filter(BonusRedemption.status == BonusRedemptionStatus(status))
    
    redemptions = query.order_by(BonusRedemption.created_at.desc()).all()
    return redemptions


@app.patch("/api/admin/bonus-redemptions/{redemption_id}", response_model=BonusRedemptionResponse)
def update_redemption_status(
    redemption_id: int,
    status: str = None,
    admin_notes: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Обновление статуса заявки на награждение"""
    redemption = db.query(BonusRedemption).filter(BonusRedemption.id == redemption_id).first()
    
    if not redemption:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    if status:
        redemption.status = BonusRedemptionStatus(status)
    
    if admin_notes:
        redemption.admin_notes = admin_notes
    
    redemption.reviewed_at = datetime.utcnow()
    redemption.reviewed_by = current_user.id
    
    db.commit()
    db.refresh(redemption)
    return redemption


# ==================== FILE UPLOAD ENDPOINT ====================

@app.post("/api/upload")
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin)
):
    """Загрузка файла (изображения) - только для админов"""
    try:
        # Генерируем уникальное имя файла
        import uuid
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Сохраняем файл
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
        
        # Возвращаем путь до файла
        return {
            "file_path": f"/uploads/{unique_filename}",
            "url": f"/uploads/{unique_filename}",
            "filename": unique_filename
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка при загрузке файла: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)