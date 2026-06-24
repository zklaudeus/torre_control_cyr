from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.modules.productividad.schemas import ProductividadFilterParams
from app.modules.productividad.service import ProductividadService
from app.modules.productividad.sync import calcular_metricas_brigada


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
    assert resultado[0].motivo_no_evaluable == "FUENTE_RESUMEN_GENERAL"
