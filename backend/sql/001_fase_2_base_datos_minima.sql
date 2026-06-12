-- Crear tabla: reportes_cyr
CREATE TABLE IF NOT EXISTS reportes_cyr (
    id SERIAL PRIMARY KEY,
    fecha_operacional DATE NOT NULL UNIQUE,
    estado VARCHAR(50) NOT NULL DEFAULT 'borrador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reportes_cyr_fecha ON reportes_cyr(fecha_operacional);

-- Crear tabla: control_brigadas_diario
CREATE TABLE IF NOT EXISTS control_brigadas_diario (
    id SERIAL PRIMARY KEY,
    fecha_operacional DATE NOT NULL,
    zona VARCHAR(100) NOT NULL,
    codigo_sap VARCHAR(50),
    patente VARCHAR(50),
    usuario VARCHAR(100),
    tipo_brigada VARCHAR(50),
    estado_brigada VARCHAR(50),
    hora_primer_movimiento TIME,
    observacion_brigada TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tipo_brigada CHECK (tipo_brigada IN ('PXQ', 'CF'))
);

CREATE INDEX IF NOT EXISTS idx_brigadas_diario_fecha_zona ON control_brigadas_diario(fecha_operacional, zona);

-- Crear tabla: control_programacion_zona
CREATE TABLE IF NOT EXISTS control_programacion_zona (
    id SERIAL PRIMARY KEY,
    fecha_operacional DATE NOT NULL,
    zona VARCHAR(100) NOT NULL,
    tipo_brigada VARCHAR(50) NOT NULL DEFAULT 'PXQ',
    reconexiones_programadas INTEGER DEFAULT 0,
    asignacion_carga INTEGER DEFAULT 0,
    corte_programado INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_programacion_fecha_zona_tipo UNIQUE(fecha_operacional, zona, tipo_brigada),
    CONSTRAINT chk_prog_tipo_brigada CHECK (tipo_brigada IN ('PXQ', 'CF'))
);

CREATE INDEX IF NOT EXISTS idx_programacion_zona_fecha_zona_tipo ON control_programacion_zona(fecha_operacional, zona, tipo_brigada);

-- Crear tabla: control_parametros_zona
CREATE TABLE IF NOT EXISTS control_parametros_zona (
    id SERIAL PRIMARY KEY,
    zona VARCHAR(100) NOT NULL,
    tipo_brigada VARCHAR(50) NOT NULL DEFAULT 'PXQ',
    brigadas_contrato INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_parametros_zona_tipo UNIQUE(zona, tipo_brigada),
    CONSTRAINT chk_param_tipo_brigada CHECK (tipo_brigada IN ('PXQ', 'CF'))
);

-- Crear tabla: control_parametros_generales
CREATE TABLE IF NOT EXISTS control_parametros_generales (
    id SERIAL PRIMARY KEY,
    meta_diaria_cortes_brigada INTEGER DEFAULT 30,
    hora_inicio_jornada TIME DEFAULT '08:00',
    hora_cierre_jornada TIME DEFAULT '14:00',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla: control_resultados_reales_zona
CREATE TABLE IF NOT EXISTS control_resultados_reales_zona (
    id SERIAL PRIMARY KEY,
    fecha_operacional DATE NOT NULL,
    zona VARCHAR(100) NOT NULL,
    total_reconexiones_ejecutadas INTEGER DEFAULT 0,
    total_cortes INTEGER DEFAULT 0,
    corte_en_poste INTEGER DEFAULT 0,
    corte_en_empalme INTEGER DEFAULT 0,
    visita_fallida INTEGER DEFAULT 0,
    primer_corte TIME,
    ultimo_corte TIME,
    acum_09 INTEGER DEFAULT 0,
    acum_10 INTEGER DEFAULT 0,
    acum_11 INTEGER DEFAULT 0,
    acum_12 INTEGER DEFAULT 0,
    acum_13 INTEGER DEFAULT 0,
    acum_14 INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_resultados_fecha_zona UNIQUE(fecha_operacional, zona)
);

CREATE INDEX IF NOT EXISTS idx_resultados_reales_fecha_zona ON control_resultados_reales_zona(fecha_operacional, zona);

-- ---------------------------------------------------------
-- SEEDS INICIALES
-- ---------------------------------------------------------

-- Zonas iniciales (NOTA: Valores actuales asumen Total Zona, asignados temporalmente a PXQ)
INSERT INTO control_parametros_zona (zona, tipo_brigada, brigadas_contrato, activo) VALUES
  ('Iquique', 'PXQ', 3, true),
  ('Coquimbo', 'PXQ', 16, true),
  ('Coquimbo', 'CF', 4, true),
  ('Santa Cruz', 'PXQ', 4, true),
  ('Talca', 'PXQ', 11, true),
  ('Talca', 'CF', 3, true),
  ('Concepción', 'PXQ', 21, true),
  ('Los Ángeles', 'PXQ', 3, true),
  ('Chillán', 'PXQ', 3, true)
ON CONFLICT (zona, tipo_brigada) DO NOTHING;

-- Parámetros generales
INSERT INTO control_parametros_generales (meta_diaria_cortes_brigada, hora_inicio_jornada, hora_cierre_jornada, activo)
SELECT 30, '08:00', '14:00', true
WHERE NOT EXISTS (SELECT 1 FROM control_parametros_generales);

-- Crear tabla: dim_tipo_brigada_usuario
CREATE TABLE IF NOT EXISTS dim_tipo_brigada_usuario (
    id SERIAL PRIMARY KEY,
    usuario_normalizado VARCHAR(100) NOT NULL UNIQUE,
    tipo_brigada VARCHAR(50) NOT NULL DEFAULT 'PXQ',
    activo BOOLEAN DEFAULT true,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dim_tipo_brigada CHECK (tipo_brigada IN ('PXQ', 'CF'))
);

-- Insertar usuarios CF iniciales
INSERT INTO dim_tipo_brigada_usuario (usuario_normalizado, tipo_brigada, activo) VALUES
('Hector Huerta', 'CF', true),
('Mauricio Veliz', 'CF', true),
('Lexter Jorquera', 'CF', true),
('Rafael Sevilla', 'CF', true),
('Alexis Sepulveda', 'CF', true),
('Bryan Rojas', 'CF', true),
('Benjamin Medina', 'CF', true)
ON CONFLICT (usuario_normalizado) DO NOTHING;
