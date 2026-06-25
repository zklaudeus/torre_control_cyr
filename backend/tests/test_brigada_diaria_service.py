from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services.brigada_diaria_service import BrigadaDiariaService


def test_validate_brigada_permite_inactiva_sin_observacion():
    item = SimpleNamespace(
        tipo_brigada="PXQ",
        estado_brigada="Inactiva",
        observacion_brigada=None,
    )

    BrigadaDiariaService()._validate_brigada(item)


def test_validate_brigada_mantiene_error_para_estado_invalido():
    item = SimpleNamespace(
        tipo_brigada="PXQ",
        estado_brigada="Suspendida",
        observacion_brigada=None,
    )

    with pytest.raises(HTTPException) as exc:
        BrigadaDiariaService()._validate_brigada(item)

    assert exc.value.status_code == 400
