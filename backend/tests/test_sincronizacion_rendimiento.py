from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.modules.productividad.schemas import ProductividadFilterParams
from app.modules.productividad.service import ProductividadService
from app.models.cyr_models import (
    RendimientoTecnicoCausaFallida,
    RendimientoTecnicoDiario,
)
from app.modules.productividad.sync import (
    calcular_metricas_brigada,
    sincronizar_rendimiento_desde_brigada,
)


def test_metricas_pxq_replican_cortes_y_fallidas_de_resumen_general():
    brigada = SimpleNamespace(
        tipo_brigada="PXQ",
        corte_en_poste=10,
        corte_en_empalme=5,
        corte_fuera_de_rango=2,
        visita_fallida=4,
        reconexiones_ejecutadas=3,
    )

    metricas = calcular_metricas_brigada(brigada)

    assert metricas["cortes_productivos"] == 17
    assert metricas["visita_fallida"] == 4
    assert metricas["reconexiones"] == 3
    assert metricas["meta_aplicada"] == 25
    assert float(metricas["cumplimiento_pct"]) == 68.0
    assert metricas["estado_diario"] == "RECUPERACION"


def test_metricas_cf_utilizan_meta_seis():
    brigada = SimpleNamespace(
        tipo_brigada="CF",
        corte_en_poste=3,
        corte_en_empalme=2,
        corte_fuera_de_rango=1,
        visita_fallida=0,
        reconexiones_ejecutadas=0,
    )

    metricas = calcular_metricas_brigada(brigada)

    assert metricas["cortes_productivos"] == 6
    assert metricas["meta_aplicada"] == 6
    assert float(metricas["cumplimiento_pct"]) == 100.0
    assert metricas["estado_diario"] == "ALTO_DESEMPENO"


def test_consulta_fecha_historica_usa_brigada_si_falta_snapshot():
    fecha = date(2026, 6, 20)
    brigada = SimpleNamespace(
        fecha_operacional=fecha,
        codigo_sap="SAP001",
        usuario="Técnico",
        zona="Concepción",
        tipo_brigada="PXQ",
        brigada="Juan Técnico",
        pareja="Pedro Apoyo",
        patente="ABCD12",
        corte_programado=18,
        corte_en_poste=4,
        corte_en_empalme=3,
        corte_fuera_de_rango=1,
        visita_fallida=2,
        reconexiones_ejecutadas=1,
    )
    service = ProductividadService()
    service.repo.obtener_rendimiento_diario = MagicMock(return_value=[])
    service.repo.obtener_brigada_fuente = MagicMock(return_value=brigada)
    service.repo.obtener_causas_fallidas = MagicMock(return_value=[])

    resultado = service.obtener_rendimiento_diario(
        MagicMock(),
        ProductividadFilterParams(
            codigo_sap="SAP001",
            fecha_desde=fecha,
            fecha_hasta=fecha,
            limit=1,
        ),
    )

    assert len(resultado) == 1
    assert resultado[0].fecha_operacional == fecha
    assert resultado[0].cortes_productivos == 8
    assert resultado[0].visita_fallida == 2
    assert resultado[0].brigada == "Juan Técnico"
    assert resultado[0].pareja == "Pedro Apoyo"
    assert resultado[0].patente == "ABCD12"
    assert resultado[0].carga_dia_evaluable == 18
    assert resultado[0].motivo_no_evaluable == "FUENTE_RESUMEN_GENERAL"


def test_rendimiento_diario_enriquece_personas_desde_brigada_fuente():
    fecha = date(2026, 6, 25)
    rendimiento = SimpleNamespace(
        fecha_operacional=fecha,
        codigo_sap="SAP002",
        usuario="Cuenta SAP",
        zona="Biobío",
        tipo_brigada="PXQ",
        corte_en_poste=6,
        corte_en_empalme=4,
        corte_fuera_de_rango=0,
        visita_fallida=1,
        reconexiones=0,
        cortes_productivos=10,
        meta_aplicada=25,
        cumplimiento_pct=40,
        es_evaluable=False,
        estado_diario=None,
        motivo_no_evaluable="JORNADA_EN_CURSO",
    )
    brigada = SimpleNamespace(
        fecha_operacional=fecha,
        codigo_sap="SAP002",
        brigada="Ana Principal",
        pareja=None,
        patente="WXYZ34",
        corte_programado=12,
    )
    db = MagicMock()
    query = MagicMock()
    query.filter.return_value = query
    query.order_by.return_value = query
    query.all.return_value = []
    db.query.return_value = query

    service = ProductividadService()
    service.repo.obtener_rendimiento_diario = MagicMock(return_value=[rendimiento])
    service.repo.obtener_brigadas_por_pares = MagicMock(
        return_value={(fecha, "SAP002"): brigada}
    )

    resultado = service.obtener_rendimiento_diario(
        db,
        ProductividadFilterParams(
            codigo_sap="SAP002",
            fecha_desde=fecha,
            fecha_hasta=fecha,
            limit=1,
        ),
    )

    assert resultado[0].brigada == "Ana Principal"
    assert resultado[0].pareja is None
    assert resultado[0].patente == "WXYZ34"
    assert resultado[0].carga_dia_evaluable == 12


def test_sincronizacion_elimina_snapshot_y_causas_si_brigada_esta_inactiva():
    db = MagicMock()
    fecha = date(2026, 6, 24)
    brigada = SimpleNamespace(
        fecha_operacional=fecha,
        codigo_sap="SAP001",
        estado_brigada="Inactiva",
    )

    resultado = sincronizar_rendimiento_desde_brigada(db, brigada)

    assert resultado is None
    modelos_consultados = [call.args[0] for call in db.query.call_args_list]
    assert RendimientoTecnicoCausaFallida in modelos_consultados
    assert RendimientoTecnicoDiario in modelos_consultados
    assert db.query.return_value.filter.return_value.delete.call_count == 2
    db.flush.assert_called_once()
