-- 011_add_total_cortes.sql
-- Agrega columna total_cortes a control_brigadas_diario si no existe.
-- Es idempotente (IF NOT EXISTS).

ALTER TABLE control_brigadas_diario
ADD COLUMN IF NOT EXISTS total_cortes INTEGER DEFAULT 0;
