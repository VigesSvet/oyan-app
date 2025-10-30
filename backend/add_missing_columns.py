"""
Скрипт для добавления недостающих колонок в PostgreSQL
"""
from sqlalchemy import text
from database import engine

def add_missing_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS verification_code VARCHAR;
            """))
            conn.commit()
            print("✅ Added verification_code column")
        except Exception as e:
            print(f"verification_code: {e}")
        
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP;
            """))
            conn.commit()
            print("✅ Added verification_code_expires column")
        except Exception as e:
            print(f"verification_code_expires: {e}")
    
    print("\n✅ Migration completed!")

if __name__ == "__main__":
    add_missing_columns()
