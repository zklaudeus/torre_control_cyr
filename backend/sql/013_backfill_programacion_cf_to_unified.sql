-- 013_backfill_programacion_cf_to_unified.sql
-- Backfill seguro: migra programación CF desde control_programacion_cf_zona (legacy)
-- hacia control_programacion_zona (unified) con tipo_brigada = 'CF'.
--
-- Reglas:
--   * Solo inserta registros que NO existan ya en unified.
--   * NO migra total_reconexiones_ejecutadas (se calcula desde control_brigadas_diario).
--   * NO borra la tabla legacy.
--   * NO toca datos PXQ.
--   * Es idempotente: se puede ejecutar múltiples veces sin duplicar.

-- ============================================================
-- PASO 1: Validación inicial (opcional, ejecutar antes)
-- ============================================================

-- 1a. Registros legacy que NO existen en unified
SELECT 'ANTES - Registros legacy sin contraparte en unified' AS control,
       l.fecha_operacional, l.zona,
       l.reconexiones_programadas AS legacy_rec_prog,
       l.total_reconexiones_ejecutadas AS legacy_rec_ejec,
       l.cortes_programados AS legacy_cortes_prog
FROM control_programacion_cf_zona l
LEFT JOIN control_programacion_zona u
    ON u.fecha_operacional = l.fecha_operacional
   AND u.zona = l.zona
   AND u.tipo_brigada = 'CF'
WHERE u.id IS NULL
ORDER BY l.fecha_operacional, l.zona;

-- 1b. Registros unified CF que NO existen en legacy
SELECT 'ANTES - Registros unified sin contraparte en legacy' AS control,
       u.fecha_operacional, u.zona,
       u.reconexiones_programadas AS unified_rec_prog,
       u.corte_programado AS unified_corte_prog
FROM control_programacion_zona u
LEFT JOIN control_programacion_cf_zona l
    ON l.fecha_operacional = u.fecha_operacional
   AND l.zona = u.zona
WHERE u.tipo_brigada = 'CF'
  AND l.id IS NULL
ORDER BY u.fecha_operacional, u.zona;

-- 1c. Registros con valores distintos (misma fecha/zona)
SELECT 'ANTES - Discrepancias de valores' AS control,
       COALESCE(l.fecha_operacional, u.fecha_operacional) AS fecha_operacional,
       COALESCE(l.zona, u.zona) AS zona,
       l.reconexiones_programadas AS legacy_rec_prog,
       u.reconexiones_programadas AS unified_rec_prog,
       l.cortes_programados AS legacy_cortes_prog,
       u.corte_programado AS unified_corte_prog
FROM control_programacion_cf_zona l
JOIN control_programacion_zona u
    ON u.fecha_operacional = l.fecha_operacional
   AND u.zona = l.zona
   AND u.tipo_brigada = 'CF'
WHERE l.reconexiones_programadas IS DISTINCT FROM u.reconexiones_programadas
   OR l.cortes_programados IS DISTINCT FROM u.corte_programado
ORDER BY 1, 2;

-- 1d. Conteo total por fecha y tabla
SELECT 'ANTES - Conteo legacy por fecha' AS control,
       fecha_operacional, count(*) AS total
FROM control_programacion_cf_zona
GROUP BY fecha_operacional
ORDER BY fecha_operacional;

SELECT 'ANTES - Conteo unified CF por fecha' AS control,
       fecha_operacional, count(*) AS total
FROM control_programacion_zona
WHERE tipo_brigada = 'CF'
GROUP BY fecha_operacional
ORDER BY fecha_operacional;

-- ============================================================
-- PASO 2: BACKFILL (idempotente)
-- ============================================================

INSERT INTO control_programacion_zona
    (fecha_operacional, zona, tipo_brigada, reconexiones_programadas, asignacion_carga, corte_programado)
SELECT
    l.fecha_operacional,
    l.zona,
    'CF'                                AS tipo_brigada,
    l.reconexiones_programadas,
    0                                   AS asignacion_carga,   -- default
    l.cortes_programados                AS corte_programado
FROM control_programacion_cf_zona l
LEFT JOIN control_programacion_zona u
    ON u.fecha_operacional = l.fecha_operacional
   AND u.zona = l.zona
   AND u.tipo_brigada = 'CF'
WHERE u.id IS NULL;

-- ============================================================
-- PASO 2b: UPDATE donde ambos existen con valores distintos
-- ============================================================
-- Caso: registro existe en legacy y unified, pero unified tiene
-- valores distintos (ej: legacy=5/40, unified=0/0 porque el
-- frontend inicializó con ceros y legacy recibió datos reales).
-- Legacy es fuente de verdad.

UPDATE control_programacion_zona u
SET
    reconexiones_programadas = l.reconexiones_programadas,
    corte_programado         = l.cortes_programados
FROM control_programacion_cf_zona l
WHERE u.fecha_operacional = l.fecha_operacional
  AND u.zona = l.zona
  AND u.tipo_brigada = 'CF'
  AND (
      u.reconexiones_programadas IS DISTINCT FROM l.reconexiones_programadas
   OR u.corte_programado         IS DISTINCT FROM l.cortes_programados
  );

-- ============================================================
-- PASO 3: Validación posterior
-- ============================================================

-- 3a. Verificar que NO queden registros legacy sin contraparte en unified
SELECT 'DESPUES - Legacy sin contraparte en unified (debe ser 0)' AS control,
       count(*) AS pendientes
FROM control_programacion_cf_zona l
LEFT JOIN control_programacion_zona u
    ON u.fecha_operacional = l.fecha_operacional
   AND u.zona = l.zona
   AND u.tipo_brigada = 'CF'
WHERE u.id IS NULL;

-- 3b. Registros unified sin contraparte en legacy (esperado: puede haber > 0)
SELECT 'DESPUES - Unified sin contraparte en legacy' AS control,
       u.fecha_operacional, u.zona,
       u.reconexiones_programadas, u.corte_programado
FROM control_programacion_zona u
LEFT JOIN control_programacion_cf_zona l
    ON l.fecha_operacional = u.fecha_operacional
   AND l.zona = u.zona
WHERE u.tipo_brigada = 'CF'
  AND l.id IS NULL
ORDER BY u.fecha_operacional, u.zona;

-- 3c. Conteo final
SELECT 'DESPUES - Conteo total por fecha (unified CF)' AS control,
       fecha_operacional, count(*) AS total
FROM control_programacion_zona
WHERE tipo_brigada = 'CF'
GROUP BY fecha_operacional
ORDER BY fecha_operacional;

SELECT 'DESPUES - Conteo total por fecha (legacy, sin cambios)' AS control,
       fecha_operacional, count(*) AS total
FROM control_programacion_cf_zona
GROUP BY fecha_operacional
ORDER BY fecha_operacional;

-- 3d. Confirmar que los 3 registros específicos fueron migrados
SELECT 'DESPUES - Confirmar migración de registros críticos' AS control,
       fecha_operacional, zona,
       reconexiones_programadas, corte_programado
FROM control_programacion_zona
WHERE tipo_brigada = 'CF'
  AND (fecha_operacional, zona) IN (
      ('2026-06-18', 'Talca'),
      ('2026-06-19', 'Coquimbo'),
      ('2026-06-19', 'Talca')
  )
ORDER BY fecha_operacional, zona;
