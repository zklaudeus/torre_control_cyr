import sys
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlSupervisorComunasZonas

db = SessionLocal()
for sup_id in [1, 3]:
    cz = db.query(ControlSupervisorComunasZonas).filter(ControlSupervisorComunasZonas.supervisor_id == sup_id).all()
    print(f"Sup {sup_id} zonas: {set([c.zona_principal for c in cz])}")
