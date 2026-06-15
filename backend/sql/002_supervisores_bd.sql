-- 002_supervisores_bd.sql

-- 1. Tabla control_supervisores
CREATE TABLE IF NOT EXISTS control_supervisores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla control_supervisor_comunas_zonas
CREATE TABLE IF NOT EXISTS control_supervisor_comunas_zonas (
    id SERIAL PRIMARY KEY,
    supervisor_id INTEGER NOT NULL REFERENCES control_supervisores(id) ON DELETE CASCADE,
    comuna VARCHAR(100) NOT NULL,
    zona_principal VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(supervisor_id, comuna)
);

-- 3. Tabla control_supervisor_usuarios_sap
CREATE TABLE IF NOT EXISTS control_supervisor_usuarios_sap (
    id SERIAL PRIMARY KEY,
    supervisor_id INTEGER NOT NULL REFERENCES control_supervisores(id) ON DELETE CASCADE,
    codigo_sap VARCHAR(50) NOT NULL,
    cuenta VARCHAR(100) NOT NULL,
    tipo_brigada VARCHAR(50) DEFAULT 'PXQ',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(supervisor_id, codigo_sap),
    UNIQUE(supervisor_id, cuenta)
);

-- Insertar datos semilla (Juan Muñoz)
INSERT INTO control_supervisores (nombre, activo)
VALUES ('Juan Muñoz', TRUE)
ON CONFLICT DO NOTHING;

-- Obtener el ID de Juan Muñoz para insertar sus relaciones
DO $$
DECLARE
    v_supervisor_id INTEGER;
BEGIN
    SELECT id INTO v_supervisor_id FROM control_supervisores WHERE nombre = 'Juan Muñoz' LIMIT 1;

    IF v_supervisor_id IS NOT NULL THEN
        -- Comunas -> Zonas
        INSERT INTO control_supervisor_comunas_zonas (supervisor_id, comuna, zona_principal) VALUES
        (v_supervisor_id, 'Coronel', 'Concepción'),
        (v_supervisor_id, 'Concepcion', 'Concepción'),
        (v_supervisor_id, 'Chiguayante', 'Concepción'),
        (v_supervisor_id, 'Talcahuano', 'Concepción'),
        (v_supervisor_id, 'San Pedro', 'Concepción'),
        (v_supervisor_id, 'Hualpen', 'Concepción'),
        (v_supervisor_id, 'Penco', 'Concepción'),
        (v_supervisor_id, 'Tome', 'Concepción'),
        (v_supervisor_id, 'Coelemu', 'Concepción'),
        (v_supervisor_id, 'San Carlos', 'Chillán'),
        (v_supervisor_id, 'Chillan Viejo', 'Chillán'),
        (v_supervisor_id, 'Chillan', 'Chillán'),
        (v_supervisor_id, 'Los Ángeles', 'Los Ángeles'),
        (v_supervisor_id, 'Los Angeles', 'Los Ángeles')
        ON CONFLICT (supervisor_id, comuna) DO NOTHING;

        -- SAP -> Cuenta
        INSERT INTO control_supervisor_usuarios_sap (supervisor_id, codigo_sap, cuenta) VALUES
        (v_supervisor_id, 'P004952', 'Claudio Escobar'),
        (v_supervisor_id, 'P000375', 'David Guevara'),
        (v_supervisor_id, 'P004950', 'Erick Oyarce'),
        (v_supervisor_id, 'P004956', 'Fabian Lopez'),
        (v_supervisor_id, 'P004984', 'Fabian Saavedra'),
        (v_supervisor_id, 'P003383', 'Gabriel Flores'),
        (v_supervisor_id, 'P004953', 'Ignacio Salas'),
        (v_supervisor_id, 'P003457', 'José Bravo'),
        (v_supervisor_id, 'P004981', 'Jose Oliva'),
        (v_supervisor_id, 'P002752', 'Juan Medina'),
        (v_supervisor_id, 'P003372', 'Marck Sanhueza'),
        (v_supervisor_id, 'P004949', 'Marco Candia'),
        (v_supervisor_id, 'P004986', 'Marlon Cartes'),
        (v_supervisor_id, 'P004951', 'Martin Sepulveda'),
        (v_supervisor_id, 'P004983', 'Paulo Soto'),
        (v_supervisor_id, 'P004561', 'Victor Faundez'),
        (v_supervisor_id, 'P004985', 'Victor Gonzalez'),
        (v_supervisor_id, 'P004954', 'Manuel Olivera'),
        (v_supervisor_id, 'P004115', 'Miguel Bello'),
        (v_supervisor_id, 'P003823', 'Rodrigo Muñoz'),
        (v_supervisor_id, 'P003014', 'Andres Gatica'),
        (v_supervisor_id, 'P002754', 'Cristian Ulloa'),
        (v_supervisor_id, 'P004560', 'Sergio Castillo')
        ON CONFLICT (supervisor_id, codigo_sap) DO NOTHING;
    END IF;
END $$;
