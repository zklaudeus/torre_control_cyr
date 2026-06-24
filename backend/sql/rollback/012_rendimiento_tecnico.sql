-- ==============================================================================
-- REVERSA 012: PRODUCTIVIDAD Y RENDIMIENTO TÉCNICO
-- Ejecutar únicamente como rollback explícito de 012_rendimiento_tecnico.sql.
-- El orden respeta las dependencias entre las siete tablas del módulo.
-- ==============================================================================

BEGIN;

DROP TABLE IF EXISTS rendimiento_tecnico_causas_fallidas;
DROP TABLE IF EXISTS rendimiento_tecnico_advertencias;
DROP TABLE IF EXISTS rendimiento_tecnico_historial;
DROP TABLE IF EXISTS rendimiento_tecnico_actual;
DROP TABLE IF EXISTS rendimiento_tecnico_diario;
DROP TABLE IF EXISTS rendimiento_tecnico_ausencias;
DROP TABLE IF EXISTS bitacoras_supervisor_diarias;

DROP INDEX IF EXISTS uq_control_supervisor_sap_codigo_activo;

COMMIT;
