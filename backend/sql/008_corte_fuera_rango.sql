ALTER TABLE control_brigadas_diario
ADD COLUMN IF NOT EXISTS corte_fuera_de_rango INTEGER DEFAULT 0;
