import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ.get('DATABASE_URL')
engine = create_engine(DATABASE_URL)

sql = """
ALTER TABLE control_brigadas_diario
ADD COLUMN IF NOT EXISTS reconexiones_ejecutadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS primer_corte TIME,
ADD COLUMN IF NOT EXISTS ultimo_corte TIME,
ADD COLUMN IF NOT EXISTS acum_09 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS acum_10 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS acum_11 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS acum_12 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS acum_13 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS acum_14 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS corte_en_poste INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS corte_en_empalme INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visita_fallida INTEGER DEFAULT 0
"""

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()
    print("Migracion OK — columnas añadidas a control_brigadas_diario")
