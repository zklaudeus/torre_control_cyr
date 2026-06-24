import sys; sys.path.insert(0, '.')
from app.core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
engine = create_engine(settings.DATABASE_URL)
with Session(engine) as session:
    from app.modules.productividad.repository import ProductividadRepository
    repo = ProductividadRepository()
    data = repo.obtener_seguimiento_tecnico(session, 'P003014')
    if data:
        print('SEGUIMIENTO OK')
        print(f'  usuario: {data["usuario"]}')
        print(f'  fase: {data["fase_actual"]}')
        print(f'  estado: {data["estado_productivo_actual"]}')
        print(f'  advertencias: {len(data["advertencias_activas"])}')
        print(f'  historial: {len(data["historial_reciente"])}')
    else:
        print('SEGUIMIENTO NULL')
session.close()
engine.dispose()
