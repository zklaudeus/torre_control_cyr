from types import SimpleNamespace

from app.models.cyr_models import (
    ControlSupervisores,
    ControlSupervisorComunasZonas,
    ControlSupervisorUsuariosSAP,
    UserZoneAccess,
)
from app.services.auth_service import _build_user_payload


class QueryStub:
    def __init__(self, first_result=None, all_result=None):
        self.first_result = first_result
        self.all_result = all_result or []

    def filter(self, *args, **kwargs):
        return self

    def distinct(self):
        return self

    def first(self):
        return self.first_result

    def all(self):
        return self.all_result


class AuthDbStub:
    def query(self, entity):
        if entity is ControlSupervisores:
            return QueryStub(first_result=SimpleNamespace(nombre="Supervisor Talca"))
        if getattr(entity, "key", None) == UserZoneAccess.zona.key:
            return QueryStub(all_result=[])
        if getattr(entity, "key", None) == ControlSupervisorComunasZonas.zona_principal.key:
            return QueryStub(all_result=[("Talca",)])
        if getattr(entity, "key", None) == ControlSupervisorUsuariosSAP.tipo_brigada.key:
            return QueryStub(all_result=[("PXQ",), ("CF",)])
        raise AssertionError(f"Query no esperada: {entity!r}")


def test_login_payload_supervisor_incluye_permiso_cf_desde_sap_activos():
    user = SimpleNamespace(
        id=10,
        usuario="jose.masso",
        rol="supervisor",
        supervisor_id=3,
    )

    payload = _build_user_payload(AuthDbStub(), user)

    assert payload["nombre"] == "Supervisor Talca"
    assert payload["zonas_asignadas"] == ["Talca"]
    assert payload["tipos_brigada_permitidos"] == ["PXQ", "CF"]
