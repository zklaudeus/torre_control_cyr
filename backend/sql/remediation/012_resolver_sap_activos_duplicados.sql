-- ==============================================================================
-- REMEDIACIÓN PREVIA A 012: SAP ACTIVOS DUPLICADOS
--
-- NO EJECUTAR SIN APROBACIÓN DBA/NEGOCIO.
--
-- El preflight del 24-06-2026 detectó 23 códigos SAP con dos asignaciones
-- activas: una asignación legacy del supervisor_id=1 creada el 17-06-2026 y
-- otra asignación regional creada el 18-06-2026. Los nombres de cuenta
-- coinciden en todos los casos.
--
-- Esta remediación desactiva únicamente la asignación legacy del supervisor 1
-- cuando existe otra asignación activa para el mismo SAP. Cualquier patrón
-- distinto provoca rollback completo.
-- ==============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
LOCK TABLE control_supervisor_usuarios_sap IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT codigo_sap
        FROM control_supervisor_usuarios_sap
        WHERE activo IS TRUE
        GROUP BY codigo_sap
        HAVING count(*) > 1
           AND (
               count(*) <> 2
               OR NOT bool_or(supervisor_id = 1)
               OR count(DISTINCT lower(btrim(cuenta))) <> 1
           )
    ) THEN
        RAISE EXCEPTION
            'Existen duplicados activos fuera del patrón aprobado; no se modifica ningún registro';
    END IF;
END
$$;

CREATE TEMP TABLE remediation_012_asignaciones_desactivadas
ON COMMIT DROP
AS
WITH updated AS (
    UPDATE control_supervisor_usuarios_sap AS legacy
    SET activo = FALSE,
        updated_at = now()
    WHERE legacy.activo IS TRUE
      AND legacy.supervisor_id = 1
      AND EXISTS (
          SELECT 1
          FROM control_supervisor_usuarios_sap AS vigente
          WHERE vigente.codigo_sap = legacy.codigo_sap
            AND vigente.activo IS TRUE
            AND vigente.supervisor_id <> legacy.supervisor_id
      )
    RETURNING legacy.id, legacy.codigo_sap, legacy.supervisor_id
)
SELECT * FROM updated;

DO $$
BEGIN
    IF EXISTS (
        SELECT codigo_sap
        FROM control_supervisor_usuarios_sap
        WHERE activo IS TRUE
        GROUP BY codigo_sap
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Persisten SAP activos duplicados después de la remediación';
    END IF;
END
$$;

SELECT id, codigo_sap, supervisor_id
FROM remediation_012_asignaciones_desactivadas
ORDER BY codigo_sap;

COMMIT;
