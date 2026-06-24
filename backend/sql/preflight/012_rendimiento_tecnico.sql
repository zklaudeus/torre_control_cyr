-- ==============================================================================
-- PREFLIGHT DBA 012: PRODUCTIVIDAD Y RENDIMIENTO TÉCNICO
-- Solo lectura. Ejecutar antes de 012_rendimiento_tecnico.sql.
-- Debe devolver las tres dependencias, PK INTEGER, cero tablas 012 preexistentes,
-- cero SAP activos vacíos y cero SAP activos duplicados.
-- ==============================================================================

BEGIN TRANSACTION READ ONLY;

SELECT
    to_regclass('control_supervisores') AS control_supervisores,
    to_regclass('control_supervisor_usuarios_sap') AS control_supervisor_usuarios_sap,
    to_regclass('control_usuarios') AS control_usuarios;

SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND column_name = 'id'
  AND table_name IN (
      'control_supervisores',
      'control_supervisor_usuarios_sap',
      'control_usuarios'
  )
ORDER BY table_name;

SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = current_schema()
  AND table_name IN (
      'bitacoras_supervisor_diarias',
      'rendimiento_tecnico_ausencias',
      'rendimiento_tecnico_diario',
      'rendimiento_tecnico_actual',
      'rendimiento_tecnico_historial',
      'rendimiento_tecnico_advertencias',
      'rendimiento_tecnico_causas_fallidas'
  )
ORDER BY table_name;

SELECT
    id,
    supervisor_id,
    codigo_sap,
    cuenta
FROM control_supervisor_usuarios_sap
WHERE activo IS TRUE
  AND (codigo_sap IS NULL OR btrim(codigo_sap) = '');

SELECT
    codigo_sap,
    count(*) AS asignaciones_activas,
    array_agg(supervisor_id ORDER BY supervisor_id) AS supervisores
FROM control_supervisor_usuarios_sap
WHERE activo IS TRUE
GROUP BY codigo_sap
HAVING count(*) > 1
ORDER BY codigo_sap;

SELECT to_regclass('uq_control_supervisor_sap_codigo_activo') AS indice_012_preexistente;

ROLLBACK;
