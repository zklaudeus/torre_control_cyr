from sqlalchemy import text
from app.core.database import engine

def main():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'control_programacion_zona'::regclass"))
        for row in res:
            print(row)

if __name__ == '__main__':
    main()
