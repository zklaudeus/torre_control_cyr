import sys
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlBrigadasDiario, ControlSupervisorUsuariosSAP, ControlSupervisores

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
    
    # Agrupar por codigo_sap (tomando el más reciente o simplemente el primero que aparezca válido)
    usuarios_dict = {}
    for h in historicos:
        if h.codigo_sap and h.usuario:
            if h.codigo_sap not in usuarios_dict:
                usuarios_dict[h.codigo_sap] = h
    
    added = 0
    for sap_code, h in usuarios_dict.items():
        # Verificar si ya existe en ControlSupervisorUsuariosSAP
        existe = db.query(ControlSupervisorUsuariosSAP).filter(
            ControlSupervisorUsuariosSAP.supervisor_id == sup.id,
            ControlSupervisorUsuariosSAP.codigo_sap == sap_code
        ).first()
        
        if not existe:
            nuevo = ControlSupervisorUsuariosSAP(
                supervisor_id=sup.id,
                codigo_sap=sap_code,
                cuenta=h.usuario,
                tipo_brigada=h.tipo_brigada or 'PXQ',
                patente_habitual=h.patente,
                brigada=h.usuario,
                pareja='',
                comuna_habitual=zona,
                activo=True
            )
            db.add(nuevo)
            added += 1
            
    db.commit()
    print(f"Added {added} missing users for {zona} ({sup.nombre})")

print("Done.")
