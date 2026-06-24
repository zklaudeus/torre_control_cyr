# Revisión DBA — Migración 012 Rendimiento Técnico

**Fecha:** 24 de junio de 2026
**Resultado:** APROBADA Y APLICADA
**Base:** conexión configurada por el backend; credenciales omitidas

## Secuencia ejecutada

1. El preflight inicial confirmó las tres tablas legacy y sus PK `INTEGER`, pero detectó 23 cuentas SAP con dos asignaciones activas.
2. Todas las duplicidades correspondían al mismo patrón: asignación legacy del `supervisor_id=1` creada el 17 de junio y asignación regional posterior creada el 18 de junio. Los nombres de cuenta coincidían.
3. Con autorización explícita se desactivaron transaccionalmente las 23 asignaciones legacy. La verificación posterior confirmó cero SAP activos duplicados.
4. El preflight final pasó todos sus controles.
5. Se aplicó `012_rendimiento_tecnico.sql` con validación previa al commit.
6. El postflight confirmó 7 tablas, 9 índices, 48 restricciones nombradas, `NUMERIC(7,2)` y cero objetos faltantes.
7. La prueba de humo insertó casos válidos en las siete tablas y confirmó el rechazo de:
   - cortes productivos inconsistentes;
   - día no evaluable sin motivo;
   - causa fallida enlazada a otro SAP.
8. La prueba de humo hizo rollback completo. Las siete tablas quedaron con cero filas.

## Artefactos de control

- `backend/scripts/run_preflight_012.py`
- `backend/scripts/run_remediation_012.py`
- `backend/scripts/run_migration_012.py`
- `backend/scripts/run_postflight_012.py`
- `backend/scripts/run_smoke_test_012.py`
- `backend/sql/preflight/012_rendimiento_tecnico.sql`
- `backend/sql/remediation/012_resolver_sap_activos_duplicados.sql`
- `backend/sql/rollback/012_rendimiento_tecnico.sql`

## Estado final

El esquema está correcto y vacío, listo para implementar y validar el dominio backend. La reversa permanece disponible, pero no fue ejecutada.
