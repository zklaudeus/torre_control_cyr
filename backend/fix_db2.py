import sys
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlBrigadasDiario, ControlSupervisorUsuariosSAP, ControlSupervisores
from sqlalchemy.exc import IntegrityError

db = SessionLocal()

# Mapeo de zona a nombre del supervisor
zona_sup_map = {
    'Coquimbo': 'Nicolas Farias',
    'Iquique': 'Eduardo Beltrán', # Let's use ilike
    'Santa Cruz': 'Cynthia Garrido'
}

for zona, sup_name in zona_sup_map.items():
    sup = db.query(ControlSupervisores).filter(ControlSupervisores.nombre.ilike(f"%{sup_name.split()[0]}%")).first()
    if not sup:
        print(f"Supervisor {sup_name} not found")
        continue
        
    print(f"Processing {zona} for {sup.nombre} (ID: {sup.id})")
    
    # Obtener usuarios históricos de la zona
    historicos = db.query(ControlBrigadasDiario).filter(ControlBrigadasDiario.zona == zona).all()
    
    # Agrupar por cuenta y codigo sap
    added = 0
    vistos_cuentas = set()
    
    for h in historicos:
        if h.codigo_sap and h.usuario:
            if h.usuario in vistos_cuentas:
                continue
            
            # Verificar si ya existe en ControlSupervisorUsuariosSAP
            existe = db.query(ControlSupervisorUsuariosSAP).filter(
                ControlSupervisorUsuariosSAP.supervisor_id == sup.id,
                ControlSupervisorUsuariosSAP.cuenta == h.usuario
            ).first()
            
            if not existe:
                vistos_cuentas.add(h.usuario)
                nuevo = ControlSupervisorUsuariosSAP(
                    supervisor_id=sup.id,
                    codigo_sap=h.codigo_sap,
                    cuenta=h.usuario,
                    tipo_brigada=h.tipo_brigada or 'PXQ',
                    patente_habitual=h.patente,
                    brigada=h.usuario,
                    pareja='',
                    comuna_habitual=zona,
                    activo=True
                )
                db.add(nuevo)
                try:
                    db.commit()
                    added += 1
                except IntegrityError:
                    db.rollback()
            else:
                vistos_cuentas.add(h.usuario)
                
    print(f"Added {added} missing users for {zona} ({sup.nombre})")

print("Done.")
