import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import engine

def apply_migration():
    load_dotenv()
    
    sql_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sql", "002_supervisores_bd.sql")
    
    print(f"Leyendo archivo de migración: {sql_file_path}")
    
    try:
        with open(sql_file_path, "r", encoding="utf-8") as f:
            sql_statements = f.read()
            
        print("Aplicando migración en la base de datos...")
        with engine.connect() as connection:
            connection.execute(text(sql_statements))
            connection.commit()
            
        print("¡Migración completada con éxito!")
    except Exception as e:
        print(f"Error durante la migración: {e}")

if __name__ == "__main__":
    apply_migration()
