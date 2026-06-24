"""Sincronización del rendimiento desde la brigada diaria canónica."""

from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.cyr_models import (
    ControlBrigadasDiario,
    ControlSupervisorUsuariosSAP,
    RendimientoTecnicoCausaFallida,
    RendimientoTecnicoDiario,
)


META_POR_TIPO = {"PXQ": 25, "CF": 6}


def calcular_metricas_brigada(brigada: ControlBrigadasDiario) -> dict:
    """Calcula las métricas que Rendimiento Técnico replica de Resumen general."""
    tipo_brigada = brigada.tipo_brigada or "PXQ"
    meta = META_POR_TIPO.get(tipo_brigada, META_POR_TIPO["PXQ"])
    corte_en_poste = int(brigada.corte_en_poste or 0)
    corte_en_empalme = int(brigada.corte_en_empalme or 0)
    corte_fuera_de_rango = int(brigada.corte_fuera_de_rango or 0)
    cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango
    cumplimiento_pct = (
        Decimal(cortes_productivos * 100) / Decimal(meta)
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    if cumplimiento_pct >= 100:
        estado_diario = "ALTO_DESEMPENO"
    elif cumplimiento_pct >= 80:
        estado_diario = "ESTABLE"
    elif cumplimiento_pct >= 50:
        estado_diario = "RECUPERACION"
    else:
        estado_diario = "CRITICO"

    return {
        "corte_en_poste": corte_en_poste,
        "corte_en_empalme": corte_en_empalme,
        "corte_fuera_de_rango": corte_fuera_de_rango,
        "visita_fallida": int(brigada.visita_fallida or 0),
        "reconexiones": int(brigada.reconexiones_ejecutadas or 0),
        "cortes_productivos": cortes_productivos,
        "meta_aplicada": meta,
        "cumplimiento_pct": cumplimiento_pct,
        "estado_diario": estado_diario,
    }


def sincronizar_rendimiento_desde_brigada(
    db: Session,
    brigada: ControlBrigadasDiario,
) -> RendimientoTecnicoDiario | None:
    """Crea o actualiza el snapshot diario desde ``control_brigadas_diario``.

    Durante la jornada el registro se conserva como no evaluable, pero sus KPIs
    quedan visibles. Si ya fue cerrado/evaluado, se respetan la bitácora y su
    evaluabilidad, recalculando el estado con los nuevos cortes efectivos.
    """
    codigo_sap = (brigada.codigo_sap or "").strip()
    if not codigo_sap or not brigada.fecha_operacional:
        return None

    metricas = calcular_metricas_brigada(brigada)
    rendimiento = db.query(RendimientoTecnicoDiario).filter(
        RendimientoTecnicoDiario.fecha_operacional == brigada.fecha_operacional,
        RendimientoTecnicoDiario.codigo_sap == codigo_sap,
    ).first()

    if rendimiento is None:
        asignacion = db.query(ControlSupervisorUsuariosSAP).filter(
            ControlSupervisorUsuariosSAP.codigo_sap == codigo_sap,
            ControlSupervisorUsuariosSAP.activo.is_(True),
        ).first()
        rendimiento = RendimientoTecnicoDiario(
            fecha_operacional=brigada.fecha_operacional,
            codigo_sap=codigo_sap,
            usuario=brigada.usuario or codigo_sap,
            supervisor_id=asignacion.supervisor_id if asignacion else None,
            zona=brigada.zona,
            tipo_brigada=brigada.tipo_brigada,
            es_evaluable=False,
            estado_diario=None,
            motivo_no_evaluable="JORNADA_EN_CURSO",
            ausencia_id=None,
            bitacora_id=None,
            **{k: v for k, v in metricas.items() if k != "estado_diario"},
        )
        db.add(rendimiento)
    else:
        rendimiento.usuario = brigada.usuario or codigo_sap
        rendimiento.zona = brigada.zona
        rendimiento.tipo_brigada = brigada.tipo_brigada
        for campo, valor in metricas.items():
            if campo != "estado_diario":
                setattr(rendimiento, campo, valor)
        if rendimiento.es_evaluable:
            rendimiento.estado_diario = metricas["estado_diario"]
            rendimiento.motivo_no_evaluable = None
        else:
            rendimiento.estado_diario = None
            rendimiento.motivo_no_evaluable = (
                rendimiento.motivo_no_evaluable or "JORNADA_EN_CURSO"
            )

    db.flush()

    causas_total = db.query(
        func.coalesce(func.sum(RendimientoTecnicoCausaFallida.cantidad), 0)
    ).filter(
        RendimientoTecnicoCausaFallida.fecha_operacional == brigada.fecha_operacional,
        RendimientoTecnicoCausaFallida.codigo_sap == codigo_sap,
    ).scalar() or 0

    # Una edición manual del total invalida un desglose anterior. Es preferible
    # mostrar que falta el detalle antes que atribuir visitas a causas incorrectas.
    if int(causas_total) != metricas["visita_fallida"]:
        db.query(RendimientoTecnicoCausaFallida).filter(
            RendimientoTecnicoCausaFallida.fecha_operacional == brigada.fecha_operacional,
            RendimientoTecnicoCausaFallida.codigo_sap == codigo_sap,
        ).delete(synchronize_session=False)
    else:
        db.query(RendimientoTecnicoCausaFallida).filter(
            RendimientoTecnicoCausaFallida.fecha_operacional == brigada.fecha_operacional,
            RendimientoTecnicoCausaFallida.codigo_sap == codigo_sap,
        ).update(
            {RendimientoTecnicoCausaFallida.rendimiento_diario_id: rendimiento.id},
            synchronize_session=False,
        )

    return rendimiento


def sincronizar_rendimientos_para_pares(
    db: Session,
    pares: set[tuple],
) -> int:
    """Sincroniza las brigadas correspondientes a pares ``(fecha, SAP)``."""
    if not pares:
        return 0
    fechas = {fecha for fecha, _ in pares}
    codigos = {codigo for _, codigo in pares}
    brigadas = db.query(ControlBrigadasDiario).filter(
        ControlBrigadasDiario.fecha_operacional.in_(fechas),
        ControlBrigadasDiario.codigo_sap.in_(codigos),
    ).order_by(ControlBrigadasDiario.id).all()

    # Si existieran duplicados históricos, la fila más reciente es la fuente.
    brigada_por_par = {
        (b.fecha_operacional, b.codigo_sap): b
        for b in brigadas
        if (b.fecha_operacional, b.codigo_sap) in pares
    }
    for brigada in brigada_por_par.values():
        sincronizar_rendimiento_desde_brigada(db, brigada)
    return len(brigada_por_par)


def eliminar_rendimiento_si_no_hay_brigada(
    db: Session,
    fecha_operacional,
    codigo_sap: str | None,
) -> None:
    """Elimina el snapshot si también desapareció su brigada fuente."""
    if not codigo_sap:
        return
    brigada_restante = db.query(ControlBrigadasDiario).filter(
        ControlBrigadasDiario.fecha_operacional == fecha_operacional,
        ControlBrigadasDiario.codigo_sap == codigo_sap,
    ).order_by(ControlBrigadasDiario.id.desc()).first()
    if brigada_restante:
        sincronizar_rendimiento_desde_brigada(db, brigada_restante)
        return

    db.query(RendimientoTecnicoCausaFallida).filter(
        RendimientoTecnicoCausaFallida.fecha_operacional == fecha_operacional,
        RendimientoTecnicoCausaFallida.codigo_sap == codigo_sap,
    ).delete(synchronize_session=False)
    db.query(RendimientoTecnicoDiario).filter(
        RendimientoTecnicoDiario.fecha_operacional == fecha_operacional,
        RendimientoTecnicoDiario.codigo_sap == codigo_sap,
    ).delete(synchronize_session=False)
