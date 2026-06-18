import sys
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlSupervisores, ControlSupervisorUsuariosSAP

db = SessionLocal()
sups = db.query(ControlSupervisores).all()
for s in sups:
    count = db.query(ControlSupervisorUsuariosSAP).filter(ControlSupervisorUsuariosSAP.supervisor_id == s.id).count()
    print(f"ID: {s.id}, Name: {s.nombre}, Active: {s.activo}, SAP Users: {count}")
