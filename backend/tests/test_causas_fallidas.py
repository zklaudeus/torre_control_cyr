from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

import pandas as pd

from app.cleaning_engine.calculator import calcular_causas_fallidas
from app.cleaning_engine.classifier import clasificar_medidas
from app.cleaning_engine.repository import _reemplazar_causas_fallidas
from app.modules.productividad.schemas import ProductividadFilterParams
from app.modules.productividad.service import ProductividadService


def test_calcular_causas_fallidas_agrupa_medidas_y_conserva_total():
    fecha = date(2026, 6, 24)
    actividades = pd.DataFrame([
        {"fecha_operacional": fecha, "codigo_sap": "SAP001", "medida_norm": "sin acceso", "foto_norm": "no"},
        {"fecha_operacional": fecha, "codigo_sap": "SAP001", "medida_norm": "sin acceso", "foto_norm": "no"},
        {"fecha_operacional": fecha, "codigo_sap": "SAP001", "medida_norm": "zona peligrosa", "foto_norm": "sí"},
        {"fecha_operacional": fecha, "codigo_sap": "SAP001", "medida_norm": "fuera de rango", "foto_norm": "sin foto"},
        {"fecha_operacional": fecha, "codigo_sap": "SAP001", "medida_norm": "fuera de rango", "foto_norm": "foto.jpg"},
    ])

    detalle = calcular_causas_fallidas(clasificar_medidas(actividades))

    cantidades = dict(zip(detalle["causa_fallida"], detalle["cantidad"]))
    assert cantidades == {
        "sin acceso": 2,
        "zona peligrosa": 1,
        "fuera de rango": 1,
    }
    assert detalle["cantidad"].sum() == 4
    observacion = detalle.loc[
        detalle["causa_fallida"] == "fuera de rango", "observacion"
    ].item()
    assert "foto válida" in observacion


def test_reemplazar_causas_solo_inserta_brigadas_validadas():
    fecha = date(2026, 6, 24)
    db = MagicMock()
    db.query.return_value.filter.return_value.all.return_value = []
    resultados = pd.DataFrame([
        {"fecha_operacional": fecha, "codigo_sap": "SAP001"},
    ])
    causas = pd.DataFrame([
        {
            "fecha_operacional": fecha,
            "codigo_sap": "SAP001",
            "causa_fallida": "sin acceso",
            "cantidad": 2,
            "observacion": None,
        },
        {
            "fecha_operacional": fecha,
            "codigo_sap": "SAP999",
            "causa_fallida": "zona peligrosa",
            "cantidad": 1,
            "observacion": None,
        },
    ])

    _reemplazar_causas_fallidas(db, resultados, causas)

    db.add.assert_called_once()
    causa_insertada = db.add.call_args.args[0]
    assert causa_insertada.codigo_sap == "SAP001"
    assert causa_insertada.causa_fallida == "sin acceso"
    assert causa_insertada.cantidad == 2
    assert causa_insertada.origen == "PROCESAMIENTO_OPERACIONAL"


def test_rendimiento_diario_adjunta_causas_sin_exigir_filtro_sap():
    fecha = date(2026, 6, 24)
    rendimiento = SimpleNamespace(
        fecha_operacional=fecha,
        codigo_sap="SAP001",
        usuario="Técnico",
        zona="Concepción",
        tipo_brigada="PXQ",
        corte_en_poste=1,
        corte_en_empalme=0,
        corte_fuera_de_rango=0,
        visita_fallida=2,
        reconexiones=0,
        cortes_productivos=1,
        meta_aplicada=25,
        cumplimiento_pct=Decimal("4.00"),
        es_evaluable=True,
        estado_diario="CRITICO",
        motivo_no_evaluable=None,
    )
    causa = SimpleNamespace(
        fecha_operacional=fecha,
        codigo_sap="SAP001",
        causa_fallida="sin acceso",
        cantidad=2,
        observacion=None,
    )
    db = MagicMock()
    db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [causa]
    service = ProductividadService()
    service.repo.obtener_rendimiento_diario = MagicMock(return_value=[rendimiento])

    resultado = service.obtener_rendimiento_diario(db, ProductividadFilterParams())

    assert len(resultado) == 1
    assert resultado[0].causas_fallidas[0].causa_fallida == "sin acceso"
    assert resultado[0].causas_fallidas[0].cantidad == 2
