from types import SimpleNamespace

from app.api.routes.supervisores import (
    _deduplicar_comunas_zonas,
    _mapa_zonas_por_comuna,
)


def test_deduplicar_comunas_zonas_normaliza_acentos_y_prefiere_presentacion_con_acento():
    comunas = [
        SimpleNamespace(id=31, comuna="Concepcion", zona_principal="Concepción"),
        SimpleNamespace(id=39, comuna="Concepción", zona_principal="Concepción"),
        SimpleNamespace(id=40, comuna="Talca", zona_principal="Talca"),
    ]

    resultado = _deduplicar_comunas_zonas(comunas)

    assert len(resultado) == 2
    assert resultado[0].comuna == "Concepción"
    assert resultado[0].zona_principal == "Concepción"
    assert resultado[1].comuna == "Talca"


def test_mapa_zonas_por_comuna_permite_buscar_sin_acentos():
    comunas = [
        SimpleNamespace(id=39, comuna="Concepción", zona_principal="Concepción"),
    ]

    zonas_por_comuna = _mapa_zonas_por_comuna(comunas)

    assert zonas_por_comuna["concepcion"] == "Concepción"
