"""
Скрипт для создания администратора
Использование: python create_admin.py
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash

# Создание таблиц
Base.metadata.create_all(bind=engine)

def create_admin():
    db: Session = SessionLocal()
    
    try:
        # Проверка существующего админа
        admin = db.query(User).filter(User.email == "admin@oyun.kz").first()
        
        if admin:
            print("⚠️  Администратор уже существует!")
            print(f"Email: {admin.email}")
            print(f"Username: {admin.username}")
            return
        
        # Создание нового администратора
        admin = User(
            email="admin@oyun.kz",
            username="admin",
            hashed_password=get_password_hash("admin123"),  # Измените пароль!
            is_admin=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Администратор успешно создан!")
        print(f"Email: admin@oyun.kz")
        print(f"Password: admin123")
        print("⚠️  ВАЖНО: Измените пароль после первого входа!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()