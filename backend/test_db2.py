import sys
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlSupervisorUsuariosSAP, ControlSupervisorComunasZonas, ControlSupervisores

db = SessionLocal()
sup_names = ["Cynthia Garrido", "Eduardo Beltran", "Nicolas Farias"]
for sn in sup_names:
    sup = db.query(ControlSupervisores).filter(ControlSupervisores.nombre.ilike(f"%{sn}%")).first()
    if sup:
        print(f"--- Supervisor: {sup.nombre} (ID: {sup.id}) ---")
        cz = db.query(ControlSupervisorComunasZonas).filter(ControlSupervisorComunasZonas.supervisor_id == sup.id).all()
        print(f"Zonas asignadas: {[c.zona_principal for c in cz]}")
        sap = db.query(ControlSupervisorUsuariosSAP).filter(ControlSupervisorUsuariosSAP.supervisor_id == sup.id).all()
        print(f"Usuarios SAP: {len(sap)}")
        if sap:
            print(f"Muestra SAP: {[s.comuna_habitual for s in sap[:3]]}")
    else:
        print(f"Supervisor {sn} no encontrado")
