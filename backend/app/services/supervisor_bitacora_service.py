from sqlalchemy.orm import Session
from app.models.cyr_models import ControlSupervisores, ControlSupervisorComunasZonas, ControlSupervisorUsuariosSAP
from app.schemas.supervisor_bitacora import BitacoraResumenPreviewReq, BitacoraResumenPreviewRes, ZonaResumenOut
from collections import defaultdict

def calcular_resumen_preview(db: Session, supervisor_id: int, req: BitacoraResumenPreviewReq) -> BitacoraResumenPreviewRes:
    # 1. Validar supervisor
    sup = db.query(ControlSupervisores).filter(ControlSupervisores.id == supervisor_id).first()
    if not sup:
        raise ValueError(f"Supervisor con ID {supervisor_id} no encontrado")

    # 2. Obtener datos permitidos del supervisor
    comunas_zonas = db.query(ControlSupervisorComunasZonas).filter(
        ControlSupervisorComunasZonas.supervisor_id == supervisor_id,
        ControlSupervisorComunasZonas.activo == True
    ).all()
    comuna_to_zona = {cz.comuna.lower().strip(): cz.zona_principal for cz in comunas_zonas}

    usuarios_sap = db.query(ControlSupervisorUsuariosSAP).filter(
        ControlSupervisorUsuariosSAP.supervisor_id == supervisor_id,
        ControlSupervisorUsuariosSAP.activo == True
    ).all()
    sap_permitidos = {u.codigo_sap for u in usuarios_sap}

    errores = []
    advertencias = []
    
    zonas_resumen = {}
    total_brigadas = 0
    total_corte_prog = 0.0
    total_reconex_prog = 0.0

    for idx, fila in enumerate(req.filas):
        # Validaciones
        if fila.codigo_sap not in sap_permitidos:
            errores.append(f"Fila {idx+1}: El SAP {fila.codigo_sap} no pertenece a este supervisor.")
            continue

        comuna_lower = fila.comuna.lower().strip()
        zona = comuna_to_zona.get(comuna_lower)
        if not zona:
            # Podría ser que mandaron directamente la zona en vez de comuna, probamos si coincide con alguna zona_principal
            zonas_unicas = set(comuna_to_zona.values())
            # Normalizamos todo a minúsculas para buscar
            zonas_unicas_lower = {z.lower().strip(): z for z in zonas_unicas}
            
            if comuna_lower in zonas_unicas_lower:
                zona = zonas_unicas_lower[comuna_lower]
            else:
                advertencias.append(f"Fila {idx+1}: La comuna/zona '{fila.comuna}' no está asignada al supervisor o no tiene zona principal.")
                continue

        if fila.tipo_brigada not in ['PXQ', 'CF']:
            errores.append(f"Fila {idx+1}: Tipo de brigada '{fila.tipo_brigada}' no permitido.")
            continue

        carga = float(fila.carga) if fila.carga is not None else 0.0
        reconexiones = float(fila.reconexiones) if fila.reconexiones is not None else 0.0

        if carga < 0 or reconexiones < 0:
            errores.append(f"Fila {idx+1}: Carga y reconexiones deben ser >= 0.")
            continue

        # Agrupar por zona y tipo_brigada
        key = (zona, fila.tipo_brigada)
        if key not in zonas_resumen:
            zonas_resumen[key] = {
                "zona": zona,
                "tipo_brigada": fila.tipo_brigada,
                "total_brigadas": 0,
                "corte_programado": 0.0,
                "reconexiones_programadas": 0.0,
            }
        
        zonas_resumen[key]["total_brigadas"] += 1
        zonas_resumen[key]["corte_programado"] += carga
        zonas_resumen[key]["reconexiones_programadas"] += reconexiones
        
        total_brigadas += 1
        total_corte_prog += carga
        total_reconex_prog += reconexiones

    # Armar lista final de zonas
    zonas_list = []
    for key, data in zonas_resumen.items():
        zona_nombre = key[0]
        # Traer total_en_bandeja si viene en el request
        # Usamos case-insensitive para buscar en el diccionario
        bandeja_dict = {k.lower().strip(): v for k, v in req.total_en_bandeja_por_zona.items()} if req.total_en_bandeja_por_zona else {}
        total_en_bandeja = bandeja_dict.get(zona_nombre.lower().strip(), 0)

        zonas_list.append(
            ZonaResumenOut(
                zona=data["zona"],
                tipo_brigada=data["tipo_brigada"],
                total_brigadas=data["total_brigadas"],
                corte_programado=data["corte_programado"],
                reconexiones_programadas=data["reconexiones_programadas"],
                total_en_bandeja=total_en_bandeja
            )
        )

    # Ordenar alfabéticamente por zona y luego por tipo
    zonas_list.sort(key=lambda x: (x.zona, x.tipo_brigada))

    return BitacoraResumenPreviewRes(
        fecha_operacional=req.fecha_operacional,
        supervisor_id=supervisor_id,
        total_brigadas=total_brigadas,
        total_corte_programado=total_corte_prog,
        total_reconexiones_programadas=total_reconex_prog,
        zonas=zonas_list,
        errores=errores,
        advertencias=advertencias
    )
