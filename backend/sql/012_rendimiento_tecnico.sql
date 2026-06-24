-- ==============================================================================
-- MIGRACIÓN 012: PRODUCTIVIDAD Y RENDIMIENTO TÉCNICO
-- ==============================================================================

BEGIN;

-- Dependencias del esquema legacy. La migración debe abortar antes de crear
-- objetos si el entorno no contiene las tablas maestras esperadas.
DO $$
BEGIN
    IF to_regclass('control_supervisores') IS NULL THEN
        RAISE EXCEPTION 'Falta la tabla requerida control_supervisores';
    END IF;
    IF to_regclass('control_supervisor_usuarios_sap') IS NULL THEN
        RAISE EXCEPTION 'Falta la tabla requerida control_supervisor_usuarios_sap';
    END IF;
    IF to_regclass('control_usuarios') IS NULL THEN
        RAISE EXCEPTION 'Falta la tabla requerida control_usuarios';
    END IF;
END
$$;

-- Una cuenta SAP activa solo puede pertenecer a un supervisor a la vez. Además
-- de proteger la identidad global usada por rendimiento_tecnico_actual, este
-- índice hace fallar la migración si el maestro requiere conciliación previa.
CREATE UNIQUE INDEX uq_control_supervisor_sap_codigo_activo
    ON control_supervisor_usuarios_sap (codigo_sap)
    WHERE activo IS TRUE;

CREATE TABLE bitacoras_supervisor_diarias (
    id BIGSERIAL PRIMARY KEY,
    fecha_operacional DATE NOT NULL,
    supervisor_id INTEGER NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'ABIERTA',
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_cierre TIMESTAMPTZ NULL,
    cerrada_por_id INTEGER NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_bitacora_fecha_sup UNIQUE (fecha_operacional, supervisor_id),
    CONSTRAINT uq_bitacora_id_sup UNIQUE (id, supervisor_id),
    CONSTRAINT fk_bitacora_supervisor FOREIGN KEY (supervisor_id) REFERENCES control_supervisores(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bitacora_cerrada_por FOREIGN KEY (cerrada_por_id) REFERENCES control_usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_bitacora_estado CHECK (estado IN ('ABIERTA', 'CERRADA_TC')),
    CONSTRAINT chk_bitacora_cierre_consistente CHECK (
        (estado = 'CERRADA_TC' AND fecha_cierre IS NOT NULL AND cerrada_por_id IS NOT NULL) OR
        (estado = 'ABIERTA' AND fecha_cierre IS NULL AND cerrada_por_id IS NULL)
    )
);

CREATE TABLE rendimiento_tecnico_ausencias (
    id BIGSERIAL PRIMARY KEY,
    codigo_sap VARCHAR(50) NOT NULL,
    fecha_operacional DATE NOT NULL,
    causa VARCHAR(100) NOT NULL,
    registrada_por_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ausencia_sap_fecha UNIQUE (codigo_sap, fecha_operacional),
    CONSTRAINT uq_ausencia_id_sap_fecha UNIQUE (id, codigo_sap, fecha_operacional),
    CONSTRAINT fk_ausencia_registrada_por FOREIGN KEY (registrada_por_id) REFERENCES control_usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ausencia_causa CHECK (causa IN ('PERMISO', 'LICENCIA', 'VACACIONES', 'MAESTRO', 'NO_REPORTADO', 'OTRO'))
);

CREATE TABLE rendimiento_tecnico_diario (
    id BIGSERIAL PRIMARY KEY,
    fecha_operacional DATE NOT NULL,
    codigo_sap VARCHAR(50) NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    supervisor_id INTEGER NULL,
    zona VARCHAR(100) NULL,
    tipo_brigada VARCHAR(50) NULL,
    corte_en_poste INTEGER NOT NULL DEFAULT 0,
    corte_en_empalme INTEGER NOT NULL DEFAULT 0,
    corte_fuera_de_rango INTEGER NOT NULL DEFAULT 0,
    visita_fallida INTEGER NOT NULL DEFAULT 0,
    reconexiones INTEGER NOT NULL DEFAULT 0,
    cortes_productivos INTEGER NOT NULL DEFAULT 0,
    meta_aplicada INTEGER NOT NULL,
    cumplimiento_pct NUMERIC(7,2) NOT NULL,
    es_evaluable BOOLEAN NOT NULL DEFAULT TRUE,
    estado_diario VARCHAR(50) NULL,
    motivo_no_evaluable VARCHAR(100) NULL,
    ausencia_id BIGINT NULL,
    bitacora_id BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_rendimiento_fecha_sap UNIQUE (fecha_operacional, codigo_sap),
    CONSTRAINT uq_rendimiento_id_sap_fecha UNIQUE (id, codigo_sap, fecha_operacional),
    CONSTRAINT fk_rendimiento_supervisor FOREIGN KEY (supervisor_id) REFERENCES control_supervisores(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rendimiento_ausencia_consistente FOREIGN KEY (ausencia_id, codigo_sap, fecha_operacional) REFERENCES rendimiento_tecnico_ausencias(id, codigo_sap, fecha_operacional),
    CONSTRAINT fk_rendimiento_bitacora_consistente FOREIGN KEY (bitacora_id, supervisor_id) REFERENCES bitacoras_supervisor_diarias(id, supervisor_id),
    CONSTRAINT chk_corte_poste_pos CHECK (corte_en_poste >= 0),
    CONSTRAINT chk_corte_empalme_pos CHECK (corte_en_empalme >= 0),
    CONSTRAINT chk_corte_fdr_pos CHECK (corte_fuera_de_rango >= 0),
    CONSTRAINT chk_fallida_pos CHECK (visita_fallida >= 0),
    CONSTRAINT chk_recon_pos CHECK (reconexiones >= 0),
    CONSTRAINT chk_cortes_prod_pos CHECK (cortes_productivos >= 0),
    CONSTRAINT chk_cortes_prod_formula CHECK (cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango),
    CONSTRAINT chk_meta_pos CHECK (meta_aplicada > 0),
    CONSTRAINT chk_cump_pos CHECK (cumplimiento_pct >= 0),
    CONSTRAINT chk_rendimiento_tipo_brigada CHECK (tipo_brigada IS NULL OR tipo_brigada IN ('PXQ', 'CF')),
    CONSTRAINT chk_estado_diario_val CHECK (estado_diario IS NULL OR estado_diario IN ('CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')),
    CONSTRAINT chk_rendimiento_evaluabilidad CHECK (
        (es_evaluable AND estado_diario IS NOT NULL AND motivo_no_evaluable IS NULL AND ausencia_id IS NULL AND bitacora_id IS NOT NULL AND supervisor_id IS NOT NULL AND tipo_brigada IS NOT NULL) OR
        (NOT es_evaluable AND estado_diario IS NULL AND motivo_no_evaluable IS NOT NULL)
    )
);

CREATE INDEX idx_rendimiento_sap_fecha ON rendimiento_tecnico_diario(codigo_sap, fecha_operacional);
CREATE INDEX idx_rendimiento_sup_fecha ON rendimiento_tecnico_diario(supervisor_id, fecha_operacional);
CREATE INDEX idx_rendimiento_zona_fecha ON rendimiento_tecnico_diario(zona, fecha_operacional);

CREATE TABLE rendimiento_tecnico_actual (
    codigo_sap VARCHAR(50) PRIMARY KEY,
    fase_actual INTEGER NOT NULL DEFAULT 1,
    estado_productivo_actual VARCHAR(50) NOT NULL DEFAULT 'SIN_EVALUACION',
    dias_consecutivos_bajo_50 INTEGER NOT NULL DEFAULT 0,
    dias_consecutivos_alto_desempeno INTEGER NOT NULL DEFAULT 0,
    advertencias_fase2 INTEGER NOT NULL DEFAULT 0,
    fecha_ultima_evaluacion DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_fase_actual_val CHECK (fase_actual IN (1, 2, 3)),
    CONSTRAINT chk_estado_actual_val CHECK (estado_productivo_actual IN ('SIN_EVALUACION', 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')),
    CONSTRAINT chk_dias_bajo_50_pos CHECK (dias_consecutivos_bajo_50 >= 0),
    CONSTRAINT chk_dias_alto_desemp_pos CHECK (dias_consecutivos_alto_desempeno >= 0),
    CONSTRAINT chk_adv_fase2_pos CHECK (advertencias_fase2 >= 0)
);

CREATE TABLE rendimiento_tecnico_historial (
    id BIGSERIAL PRIMARY KEY,
    codigo_sap VARCHAR(50) NOT NULL,
    fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT now(),
    tipo_cambio VARCHAR(50) NOT NULL,
    fase_anterior INTEGER NULL,
    fase_nueva INTEGER NULL,
    estado_anterior VARCHAR(50) NULL,
    estado_nuevo VARCHAR(50) NULL,
    motivo TEXT NULL,
    usuario_id INTEGER NULL,
    regla_disparadora VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES control_usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_tipo_cambio_val CHECK (tipo_cambio IN ('FASE', 'ESTADO_ACTUAL', 'OVERRIDE_MANUAL', 'ADVERTENCIA', 'RECALCULO')),
    CONSTRAINT chk_fase_anterior_val CHECK (fase_anterior IS NULL OR fase_anterior IN (1, 2, 3)),
    CONSTRAINT chk_fase_nueva_val CHECK (fase_nueva IS NULL OR fase_nueva IN (1, 2, 3)),
    CONSTRAINT chk_estado_anterior_val CHECK (estado_anterior IS NULL OR estado_anterior IN ('SIN_EVALUACION', 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')),
    CONSTRAINT chk_estado_nuevo_val CHECK (estado_nuevo IS NULL OR estado_nuevo IN ('SIN_EVALUACION', 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')),
    CONSTRAINT chk_override_usuario CHECK (tipo_cambio <> 'OVERRIDE_MANUAL' OR usuario_id IS NOT NULL)
);

CREATE INDEX idx_rendimiento_hist_sap_fecha ON rendimiento_tecnico_historial(codigo_sap, fecha_cambio);

CREATE TABLE rendimiento_tecnico_advertencias (
    id BIGSERIAL PRIMARY KEY,
    codigo_sap VARCHAR(50) NOT NULL,
    fecha_operacional DATE NOT NULL,
    fase_al_momento INTEGER NOT NULL DEFAULT 2,
    numero_advertencia INTEGER NULL,
    motivo TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'ACTIVA',
    registrada_por_id INTEGER NOT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
    anulada_por_id INTEGER NULL,
    fecha_anulacion TIMESTAMPTZ NULL,
    motivo_anulacion TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_advertencia_registrada_por FOREIGN KEY (registrada_por_id) REFERENCES control_usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_advertencia_anulada_por FOREIGN KEY (anulada_por_id) REFERENCES control_usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_adv_estado CHECK (estado IN ('ACTIVA', 'ANULADA')),
    CONSTRAINT chk_adv_fase CHECK (fase_al_momento IN (1, 2, 3)),
    CONSTRAINT chk_adv_numero_pos CHECK (numero_advertencia IS NULL OR numero_advertencia >= 1),
    CONSTRAINT chk_adv_anulacion_consistente CHECK (
        (estado = 'ANULADA' AND anulada_por_id IS NOT NULL AND fecha_anulacion IS NOT NULL AND motivo_anulacion IS NOT NULL) OR
        (estado = 'ACTIVA' AND anulada_por_id IS NULL AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
    )
);

CREATE INDEX idx_rendimiento_adv_sap_estado_fase ON rendimiento_tecnico_advertencias(codigo_sap, estado, fase_al_momento);

CREATE TABLE rendimiento_tecnico_causas_fallidas (
    id BIGSERIAL PRIMARY KEY,
    fecha_operacional DATE NOT NULL,
    codigo_sap VARCHAR(50) NOT NULL,
    rendimiento_diario_id BIGINT NULL,
    causa_fallida VARCHAR(200) NOT NULL,
    cantidad INTEGER NOT NULL,
    observacion TEXT NULL,
    origen VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_fallidas_rendimiento_consistente FOREIGN KEY (rendimiento_diario_id, codigo_sap, fecha_operacional) REFERENCES rendimiento_tecnico_diario(id, codigo_sap, fecha_operacional),
    CONSTRAINT uq_fallida_fecha_sap_causa UNIQUE (fecha_operacional, codigo_sap, causa_fallida),
    CONSTRAINT chk_fallida_cantidad_pos CHECK (cantidad > 0)
);

CREATE INDEX idx_fallida_sap_fecha ON rendimiento_tecnico_causas_fallidas(codigo_sap, fecha_operacional);
CREATE INDEX idx_fallida_causa ON rendimiento_tecnico_causas_fallidas(causa_fallida);
CREATE INDEX idx_fallida_rendimiento_id ON rendimiento_tecnico_causas_fallidas(rendimiento_diario_id);

COMMIT;
