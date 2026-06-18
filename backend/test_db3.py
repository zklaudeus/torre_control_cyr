import sys
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlSupervisorUsuariosSAP

db = SessionLocal()
sap = db.query(ControlSupervisorUsuariosSAP).all()
coquimbo = [s for s in sap if s.comuna_habitual and 'coquimbo' in s.comuna_habitual.lower()]
santa = [s for s in sap if s.comuna_habitual and 'santa' in s.comuna_habitual.lower()]

print("Coquimbo SAP users:", len(coquimbo))
print("Santa Cruz SAP users:", len(santa))
print("All unique comunas_habituales in SAP table:", set([s.comuna_habitual for s in sap]))
