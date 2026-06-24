import sys; sys.path.insert(0, '.')
from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    rows = conn.execute(text("SELECT id, usuario, password_hash, rol_id FROM usuarios LIMIT 10")).all()
    for r in rows:
        print(f"  id={r.id} usuario={r.usuario} hash={r.password_hash[:40] if r.password_hash else 'NULL'}... rol_id={r.rol_id}")
engine.dispose()
