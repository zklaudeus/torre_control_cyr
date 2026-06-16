-- 006_corregir_mapeo_brigadas.sql

BEGIN;

-- 1. Eliminar duplicados exactos en la misma fecha (mismo codigo_sap y tipo_brigada).
-- Específicamente soluciona el caso de P004983 Paulo Soto duplicado.
-- Conservamos la fila con el menor ID (la primera ingresada) y eliminamos las posteriores.
DELETE FROM control_brigadas_diario
WHERE id IN (
    SELECT a.id
    FROM control_brigadas_diario a
    JOIN control_brigadas_diario b
      ON a.fecha_operacional = b.fecha_operacional
     AND a.codigo_sap = b.codigo_sap
     AND a.tipo_brigada = b.tipo_brigada
     AND a.zona = b.zona
     AND a.id > b.id
);

-- 2. Actualizar el campo 'usuario' en la bitácora diaria para que almacene 
-- el nombre real de la cuenta (Camilo Cisternas, etc.) en lugar del nombre de la brigada o código.
UPDATE control_brigadas_diario
SET usuario = csus.cuenta
FROM control_supervisor_usuarios_sap csus
WHERE control_brigadas_diario.codigo_sap = csus.codigo_sap
  AND control_brigadas_diario.codigo_sap IS NOT NULL
  AND csus.cuenta IS NOT NULL
  AND control_brigadas_diario.usuario != csus.cuenta;

COMMIT;
