from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg2://postgres:admin123@localhost:5433/torre_control_cyr")

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE control_brigadas_diario ADD COLUMN corte_programado INTEGER DEFAULT 0"))
        print("Agregado corte_programado")
    except Exception as e:
        print("corte_programado:", e)

    try:
        conn.execute(text("ALTER TABLE control_brigadas_diario ADD COLUMN reconexiones_programadas INTEGER DEFAULT 0"))
        print("Agregado reconexiones_programadas")
    except Exception as e:
        print("reconexiones_programadas:", e)

    conn.commit()
