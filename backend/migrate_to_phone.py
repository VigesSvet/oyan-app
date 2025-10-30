"""
Скрипт миграции: переход с email на phone_number
ВНИМАНИЕ: Этот скрипт удалит все данные!
Использование: python migrate_to_phone.py
"""
import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash

def migrate():
    db_path = "oyun.db"
    
    # Проверка, запущен ли сервер
    try:
        # Пытаемся открыть файл в эксклюзивном режиме
        with open(db_path, 'a'):
            pass
    except Exception as e:
        print("❌ ОШИБКА: База данных заблокирована!")
        print("Пожалуйста, остановите сервер FastAPI перед миграцией.")
        print("Нажмите Ctrl+C в окне сервера, затем запустите этот скрипт снова.")
        sys.exit(1)
    
    # Удаление старой базы данных
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print("✅ Старая база данных удалена")
        except Exception as e:
            print(f"❌ Не удалось удалить базу данных: {e}")
            print("Остановите сервер и попробуйте снова.")
            sys.exit(1)
    
    # Создание новой базы данных
    Base.metadata.create_all(bind=engine)
    print("✅ Новая база данных создана")
    
    # Создание администратора
    db: Session = SessionLocal()
    try:
        admin = User(
            phone_number="+77777777777",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            is_admin=True,
            is_phone_verified=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("\n" + "="*50)
        print("✅ МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!")
        print("="*50)
        print("\n📱 Данные администратора:")
        print(f"   Телефон: +77777777777")
        print(f"   Пароль: admin123")
        print("\n⚠️  ВАЖНО: Измените пароль после первого входа!")
        print("\n💡 Теперь можно запустить сервер: uvicorn main:app --reload")
        print("="*50)
        
    except Exception as e:
        print(f"❌ Ошибка при создании админа: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🔄 МИГРАЦИЯ: Email → Phone Number")
    print("="*50)
    print("\n⚠️  ВНИМАНИЕ! Все данные будут удалены!")
    
    response = input("\nПродолжить? (yes/no): ")
    if response.lower() in ['yes', 'y', 'да']:
        migrate()
    else:
        print("Миграция отменена")