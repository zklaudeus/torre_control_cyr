-- Migration 017: Tabla de recomendaciones del supervisor por técnico
-- Permite a supervisores y torre_control agregar comentarios/recomendaciones con CRUD completo.

CREATE TABLE IF NOT EXISTS rendimiento_tecnico_recomendaciones (
    id                  BIGSERIAL PRIMARY KEY,
    codigo_sap          VARCHAR(50) NOT NULL,
    comentario          TEXT NOT NULL,
    prioridad           VARCHAR(10) NOT NULL DEFAULT 'MEDIA',
    estado_accion       VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    usuario_id          INTEGER NOT NULL REFERENCES control_usuarios(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_recomendacion_prioridad
        CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
    CONSTRAINT chk_recomendacion_estado_accion
        CHECK (estado_accion IN ('PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'CANCELADO'))
);

CREATE INDEX IF NOT EXISTS idx_recomendacion_sap ON rendimiento_tecnico_recomendaciones(codigo_sap);
CREATE INDEX IF NOT EXISTS idx_recomendacion_usuario ON rendimiento_tecnico_recomendaciones(usuario_id);
