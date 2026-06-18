import sys
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlSupervisorUsuariosSAP

db = SessionLocal()
print('Nicolas:', db.query(ControlSupervisorUsuariosSAP).filter(ControlSupervisorUsuariosSAP.supervisor_id == 5).count())
print('Eduardo:', db.query(ControlSupervisorUsuariosSAP).filter(ControlSupervisorUsuariosSAP.supervisor_id == 4).count())
