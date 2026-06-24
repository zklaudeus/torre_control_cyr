from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.modules.productividad.service import ProductividadService


def brigada(fecha, poste, empalme=0, fuera_rango=0, fallidas=0):
    return SimpleNamespace(
        id=int(fecha.strftime("%d")),
        fecha_operacional=fecha,
        codigo_sap="SAP001",
        usuario="Técnico",
        zona="Concepción",
        tipo_brigada="PXQ",
        estado_brigada="Operativa",
        corte_en_poste=poste,
        corte_en_empalme=empalme,
        corte_fuera_de_rango=fuera_rango,
        visita_fallida=fallidas,
        reconexiones_ejecutadas=0,
    )


def test_resumen_kpis_calcula_valores_reales_del_periodo():
    dia_1 = brigada(date(2026, 6, 2), 8, 2, 0, 2)   # 10 cortes, 40%
    dia_2 = brigada(date(2026, 6, 3), 20, 5, 0, 1)  # 25 cortes, 100%
    dia_3 = brigada(date(2026, 6, 4), 24, 5, 1, 0)  # 30 cortes, 120%
    service = ProductividadService()
    service.repo.obtener_brigadas_periodo = MagicMock(
        return_value=[dia_1, dia_2, dia_3]
    )
    service.repo.obtener_brigada_anterior = MagicMock(return_value=dia_2)

    resumen = service.obtener_resumen_kpis(
        MagicMock(), "SAP001", date(2026, 6, 4)
    )

    assert resumen.productividad_diaria == 30
    assert float(resumen.productividad_promedio) == 21.67
    assert resumen.mejor_productividad == 30
    assert resumen.fecha_mejor_productividad == date(2026, 6, 4)
    assert float(resumen.cumplimiento_diario_pct) == 120.0
    assert float(resumen.cumplimiento_acumulado_pct) == 86.67
    assert resumen.total_cortes_acumulados == 65
    assert resumen.total_meta_acumulada == 75
    assert resumen.dias_bajo_meta == 1
    assert resumen.dias_criticos == 1
    assert resumen.fallidas_dia == 0
    assert resumen.fallidas_acumuladas == 3
    assert resumen.fallidas_ultimos_7_dias == 3
    assert resumen.fallidas_ultimos_14_dias == 3
    assert resumen.fallidas_variacion_abs == -1
    assert float(resumen.fallidas_variacion_pct) == -100.0
    assert len(resumen.dias) == 3


def test_resumen_kpis_sin_datos_no_inventa_valores():
    service = ProductividadService()
    service.repo.obtener_brigadas_periodo = MagicMock(return_value=[])

    resumen = service.obtener_resumen_kpis(
        MagicMock(), "SAP999", date(2026, 6, 4)
    )

    assert resumen.productividad_diaria is None
    assert resumen.productividad_promedio is None
    assert resumen.mejor_productividad is None
    assert resumen.cumplimiento_diario_pct is None
    assert resumen.dias_con_datos == 0
    assert resumen.total_cortes_acumulados == 0
    assert resumen.dias == []
