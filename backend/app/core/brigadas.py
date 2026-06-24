"""Reglas compartidas para decidir qué brigadas aportan a los indicadores.

``ESTADO_INACTIVO`` es la **única fuente de verdad** del valor de estado que
excluye una brigada de los cálculos.  Todos los módulos deben importar esta
constante en lugar de hardcodear el string "inactiva".

Una brigada inactiva:
  - **Permanece visible** en la bitácora (el endpoint GET /brigadas-dia la
    devuelve sin filtro para que pueda editarse).
  - **Es invisible** para todos los indicadores, reportes, agregados de zona
    y snapshots de rendimiento técnico.
"""

from sqlalchemy import and_, exists, func, or_


# Valor canónico (case-insensitive) que marca una brigada como no contabilizable.
# Importar desde aquí en lugar de hardcodear el string en otros módulos.
ESTADO_INACTIVO = "inactiva"


def es_estado_brigada_inactivo(estado: str | None) -> bool:
    """Devuelve ``True`` si *estado* representa el estado inactivo.

    Normaliza espacios y mayúsculas para tolerar variaciones de entrada.
    """
    return (estado or "").strip().casefold() == ESTADO_INACTIVO


def es_brigada_contabilizable(brigada) -> bool:
    """``True`` si la brigada aporta a indicadores y reportes.

    Una brigada inactiva existe en la bitácora pero **no** en los cálculos.
    Usar esta función en código Python; usar :func:`condicion_brigada_contabilizable`
    en consultas SQL/ORM.
    """
    return not es_estado_brigada_inactivo(getattr(brigada, "estado_brigada", None))


def condicion_brigada_contabilizable(modelo):
    """Expresión SQL/ORM equivalente a :func:`es_brigada_contabilizable`.

    Aplicar en ``.filter()`` de cualquier query que agregue o muestre
    indicadores derivados de ``control_brigadas_diario``.
    Devuelve las filas cuyo ``estado_brigada`` **no** sea el valor inactivo
    (tolerante a espacios, mayúsculas y NULL).
    """
    estado_normalizado = func.lower(func.trim(modelo.estado_brigada))
    return or_(modelo.estado_brigada.is_(None), estado_normalizado != ESTADO_INACTIVO)


def condicion_rendimiento_con_brigada_contabilizable(
    modelo_rendimiento,
    modelo_brigada,
):
    """Exige que un snapshot de rendimiento tenga una brigada fuente contabilizable.

    Garantía: si la brigada fuente pasa a inactiva, el snapshot de rendimiento
    deja de ser visible en todos los indicadores aunque persista en la tabla.
    """
    return exists().where(
        and_(
            modelo_brigada.fecha_operacional == modelo_rendimiento.fecha_operacional,
            modelo_brigada.codigo_sap == modelo_rendimiento.codigo_sap,
            condicion_brigada_contabilizable(modelo_brigada),
        )
    )
