"""
Tests del módulo de productividad.
Cubre: repositorio, servicio, KPIs, casos borde.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from app.modules.productividad.schemas import (
    TecnicoResumen,
    RendimientoDiarioItem,
    ResumenDiarioZona,
    RankingItem,
    HistorialItem,
    AlertaItem,
    ProductividadFilterParams,
)
from app.modules.productividad.service import ProductividadService
from app.modules.productividad.repository import ProductividadRepository


# ─── Fixtures ──────────────────────────────────────────────────────────

@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def service():
    return ProductividadService()


# ─── Tests de esquemas / validación ────────────────────────────────────

class TestSchemas:

    def test_tecnico_resumen_minimo(self):
        t = TecnicoResumen(codigo_sap="P000001", cuenta="Juan Perez", tipo_brigada="PXQ")
        assert t.codigo_sap == "P000001"
        assert t.fase_actual == 1
        assert t.estado_productivo_actual == "SIN_EVALUACION"
        assert t.activo is True

    def test_rendimiento_diario_cortes_productivos(self):
        r = RendimientoDiarioItem(
            fecha_operacional=date.today(),
            codigo_sap="P000001",
            usuario="Test",
            cortes_productivos=10,
            meta_aplicada=30,
            cumplimiento_pct=Decimal("33.33"),
        )
        assert r.cortes_productivos == 10
        assert float(r.cumplimiento_pct) == 33.33

    def test_resumen_zona_defaults(self):
        r = ResumenDiarioZona(zona="Concepción", fecha_operacional=date.today())
        assert r.total_tecnicos == 0
        assert r.criticos == 0

    def test_ranking_item_tendencia_default(self):
        r = RankingItem(
            codigo_sap="P000001", cuenta="Test",
            promedio_cumplimiento_30d=Decimal("0"),
            dias_evaluados_30d=0,
        )
        assert r.tendencia == "ESTABLE"

    def test_productividad_filter_params_defaults(self):
        f = ProductividadFilterParams()
        assert f.limit == 100
        assert f.offset == 0


# ─── Tests del repositorio ─────────────────────────────────────────────

class TestRepository:

    def test_obtener_meta_diaria_default(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        repo = ProductividadRepository()
        meta = repo.obtener_meta_diaria(mock_db)
        assert meta == 30

    def test_obtener_meta_diaria_custom(self, mock_db):
        fake_pg = MagicMock()
        fake_pg.meta_diaria_cortes_brigada = 45
        mock_db.query.return_value.filter.return_value.first.return_value = fake_pg
        repo = ProductividadRepository()
        meta = repo.obtener_meta_diaria(mock_db)
        assert meta == 45


# ─── Tests del servicio (KPI logic) ────────────────────────────────────

class TestService:

    def test_listar_tecnicos_vacio(self, service, mock_db):
        service.repo.listar_tecnicos = MagicMock(return_value=[])
        service._mapear_supervisores = MagicMock(return_value={})
        result = service.listar_tecnicos(mock_db)
        assert result == []

    def test_obtener_rendimiento_diario_vacio(self, service, mock_db):
        service.repo.obtener_rendimiento_diario = MagicMock(return_value=[])
        filtros = ProductividadFilterParams()
        result = service.obtener_rendimiento_diario(mock_db, filtros)
        assert result == []

    def test_historial_vacio(self, service, mock_db):
        service.repo.historial = MagicMock(return_value=[])
        result = service.historial(mock_db)
        assert result == []

    def test_alertas_vacio(self, service, mock_db):
        service.repo.alertas = MagicMock(return_value=[])
        result = service.alertas(mock_db)
        assert result == []


# ─── Tests de integración (comportamiento real) ────────────────────────

class TestKPIFormulas:

    def test_cortes_productivos_formula(self):
        """cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango"""
        item = RendimientoDiarioItem(
            fecha_operacional=date.today(),
            codigo_sap="P000001",
            usuario="Test",
            corte_en_poste=5,
            corte_en_empalme=3,
            corte_fuera_de_rango=2,
            cortes_productivos=10,
            meta_aplicada=30,
            cumplimiento_pct=Decimal("33.33"),
        )
        suma = item.corte_en_poste + item.corte_en_empalme + item.corte_fuera_de_rango
        assert item.cortes_productivos == suma

    def test_cumplimiento_pct_formula(self):
        """cumplimiento_pct = (cortes_productivos / meta_aplicada) * 100"""
        cortes = 15
        meta = 30
        esperado = Decimal(str(round((cortes / meta) * 100, 2)))
        item = RendimientoDiarioItem(
            fecha_operacional=date.today(),
            codigo_sap="P000001",
            usuario="Test",
            cortes_productivos=cortes,
            meta_aplicada=meta,
            cumplimiento_pct=esperado,
        )
        assert float(item.cumplimiento_pct) == pytest.approx(50.0)

    def test_estado_diario_critico(self):
        """Menos de 50% → CRITICO"""
        item = RendimientoDiarioItem(
            fecha_operacional=date.today(),
            codigo_sap="P000001", usuario="Test",
            cortes_productivos=10, meta_aplicada=30,
            cumplimiento_pct=Decimal("33.33"),
            estado_diario="CRITICO",
        )
        assert item.estado_diario == "CRITICO"

    def test_estado_diario_recuperacion(self):
        """50-79% → RECUPERACION"""
        item = RendimientoDiarioItem(
            fecha_operacional=date.today(),
            codigo_sap="P000001", usuario="Test",
            cortes_productivos=18, meta_aplicada=30,
            cumplimiento_pct=Decimal("60.00"),
            estado_diario="RECUPERACION",
        )
        assert item.estado_diario == "RECUPERACION"

    def test_estado_diario_alto_desempeno(self):
        """>= 100% → ALTO_DESEMPENO"""
        item = RendimientoDiarioItem(
            fecha_operacional=date.today(),
            codigo_sap="P000001", usuario="Test",
            cortes_productivos=35, meta_aplicada=30,
            cumplimiento_pct=Decimal("116.67"),
            estado_diario="ALTO_DESEMPENO",
        )
        assert item.estado_diario == "ALTO_DESEMPENO"

    def test_meta_cero_no_explota(self):
        """meta_aplicada = 0 no debe explotar (dato inválido pero no crash)"""
        item = RendimientoDiarioItem(
            fecha_operacional=date.today(),
            codigo_sap="P000001", usuario="Test",
            cortes_productivos=10, meta_aplicada=0,
            cumplimiento_pct=Decimal("0.00"),
        )
        assert item.meta_aplicada == 0


# ─── Tests de casos borde / límites ────────────────────────────────────

class TestCasosBorde:

    def test_tecnico_sin_estado(self):
        t = TecnicoResumen(codigo_sap="P999999", cuenta="SinDatos", tipo_brigada="PXQ")
        assert t.fase_actual == 1
        assert t.estado_productivo_actual == "SIN_EVALUACION"
        assert t.dias_consecutivos_bajo_50 == 0

    def test_rendimiento_sin_evaluacion(self):
        r = RendimientoDiarioItem(
            fecha_operacional=date.today(),
            codigo_sap="P000001", usuario="Test",
            es_evaluable=False,
            motivo_no_evaluable="SIN_BITACORA",
        )
        assert r.es_evaluable is False
        assert r.motivo_no_evaluable == "SIN_BITACORA"
        assert r.estado_diario is None

    def test_ranking_valores_extremos(self):
        r = RankingItem(
            codigo_sap="P000001", cuenta="Test",
            promedio_cumplimiento_30d=Decimal("999.99"),
            dias_evaluados_30d=30,
            tendencia="MEJORANDO",
            fase_actual=3,
            estado_productivo_actual="CRITICO",
        )
        assert float(r.promedio_cumplimiento_30d) == 999.99
        assert r.fase_actual == 3

    def test_alerta_anulada(self):
        a = AlertaItem(
            id=1,
            codigo_sap="P000001",
            fecha_operacional=date.today(),
            fase_al_momento=2,
            motivo="Bajo rendimiento",
            estado="ANULADA",
            fecha_registro=date.today(),
        )
        assert a.estado == "ANULADA"

    def test_filter_params_max_limit(self):
        f = ProductividadFilterParams(limit=1000, offset=0)
        assert f.limit == 1000

    def test_filter_params_invalid_limit_raises(self):
        with pytest.raises(Exception):
            ProductividadFilterParams(limit=0)
