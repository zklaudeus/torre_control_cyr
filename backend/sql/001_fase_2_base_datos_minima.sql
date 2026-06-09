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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brigadas_diario_fecha_zona ON control_brigadas_diario(fecha_operacional, zona);

-- Crear tabla: control_programacion_zona
CREATE TABLE IF NOT EXISTS control_programacion_zona (
    id SERIAL PRIMARY KEY,
    fecha_operacional DATE NOT NULL,
    zona VARCHAR(100) NOT NULL,
    reconexiones_programadas INTEGER DEFAULT 0,
    asignacion_carga INTEGER DEFAULT 0,
    corte_programado INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_programacion_fecha_zona UNIQUE(fecha_operacional, zona)
);

CREATE INDEX IF NOT EXISTS idx_programacion_zona_fecha_zona ON control_programacion_zona(fecha_operacional, zona);

-- Crear tabla: control_parametros_zona
CREATE TABLE IF NOT EXISTS control_parametros_zona (
    id SERIAL PRIMARY KEY,
    zona VARCHAR(100) NOT NULL UNIQUE,
    brigadas_contrato INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Zonas iniciales
INSERT INTO control_parametros_zona (zona, brigadas_contrato, activo) VALUES
('Iquique', 3, true),
('Coquimbo', 16, true),
('Santa Cruz', 4, true),
('Talca', 11, true),
('Concepción', 21, true),
('Los Ángeles', 3, true),
('Chillán', 3, true)
ON CONFLICT (zona) DO NOTHING;

-- Parámetros generales
INSERT INTO control_parametros_generales (meta_diaria_cortes_brigada, hora_inicio_jornada, hora_cierre_jornada, activo)
SELECT 30, '08:00', '14:00', true
WHERE NOT EXISTS (SELECT 1 FROM control_parametros_generales);
