import sys
import os
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlSupervisorUsuariosSAP, ControlSupervisorComunasZonas

db = SessionLocal()
sap = db.query(ControlSupervisorUsuariosSAP).all()
print('Total SAP:', len(sap))
print('Sample SAP comunas:', [s.comuna_habitual for s in sap[:10]])

c = db.query(ControlSupervisorComunasZonas).all()
print('Total Comunas:', len(c))
print('Sample Comunas Zonas:', [(cz.supervisor_id, cz.comuna, cz.zona_principal) for cz in c[:10]])
