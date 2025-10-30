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
        admin = db.query(User).filter(User.phone_number == "+77777777777").first()
        
        if admin:
            print("⚠️  Администратор уже существует!")
            print(f"Телефон: {admin.phone_number}")
            print(f"Username: {admin.username}")
            return
        
        # Создание нового администратора
        admin = User(
            phone_number="+77777777777",
            username="admin",
            hashed_password=get_password_hash("admin123"),  # Измените пароль!
            is_admin=True,
            is_phone_verified=True  # Админ автоматически верифицирован
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Администратор успешно создан!")
        print(f"Телефон: +77777777777")
        print(f"Password: admin123")
        print("⚠️  ВАЖНО: Измените пароль после первого входа!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()