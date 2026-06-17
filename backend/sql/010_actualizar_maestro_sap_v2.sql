-- 010_actualizar_maestro_sap_v2.sql
-- Actualización lista maestra SAP - Junio 2026
--
-- Zonas del sistema:
--   Concepción  → tipo PXQ
--   Los Ángeles → tipo PXQ
--   Chillán     → tipo PXQ
--   Iquique     → tipo PXQ
--   Talca       → tipo PXQ / CF
--   Santa Cruz  → tipo PXQ
--   Coquimbo    → tipo PXQ / CF
--
-- Cambios respecto a versión anterior (007):
--   NUEVOS:
--     P004982 Fabian Saavedra   (Concepción, PXQ)
--     P003869 Cristofer Mancilla (Talca, PXQ)
--     P003887 José Silva         (Coquimbo, PXQ)
--   CORRECCIONES DE NOMBRE:
--     P004955: "Victor Gonzales" → "Victor Gonzalez"
--     P004546: "BENJAMIn DÍAZ"  → "Benjamin Díaz"

BEGIN;

DO $$
DECLARE
    default_sup INTEGER;
    r RECORD;
BEGIN
    -- Obtenemos el supervisor principal para asignar brigadas nuevas
    SELECT id INTO default_sup FROM control_supervisores WHERE nombre = 'Juan Muñoz' LIMIT 1;
    IF default_sup IS NULL THEN
        SELECT id INTO default_sup FROM control_supervisores ORDER BY id LIMIT 1;
    END IF;

    -- Iteramos sobre la lista completa de SAPs actualizada
    FOR r IN SELECT * FROM (VALUES
        -- ============================================================
        -- CONCEPCIÓN (PXQ)
        -- ============================================================
        ('P004985', 'Boris Cerro',         'PXQ'),
        ('P004952', 'Claudio Escobar',     'PXQ'),
        ('P000375', 'David Guevara',       'PXQ'),
        ('P004950', 'Erick Oyarce',        'PXQ'),
        ('P004956', 'Fabian Lopez',        'PXQ'),
        ('P004982', 'Fabian Saavedra',     'PXQ'),  -- NUEVO
        ('P004984', 'Felipe Lopez',        'PXQ'),
        ('P003383', 'Gabriel Flores',      'PXQ'),
        ('P004953', 'Ignacio Salas',       'PXQ'),
        ('P003457', 'José Bravo',          'PXQ'),
        ('P004981', 'Jose Oliva',          'PXQ'),
        ('P002752', 'Juan Medina',         'PXQ'),
        ('P003372', 'Marck Sanhueza',      'PXQ'),
        ('P004949', 'Marco Candia',        'PXQ'),
        ('P004951', 'Martin Sepulveda',    'PXQ'),
        ('P004983', 'Paulo Soto',          'PXQ'),
        ('P004542', 'Sebastian Rodriguez', 'PXQ'),
        ('P004561', 'Victor Faundez',      'PXQ'),
        ('P004955', 'Victor Gonzalez',     'PXQ'),  -- CORRECCIÓN: Gonzales → Gonzalez

        -- ============================================================
        -- LOS ÁNGELES (PXQ)
        -- ============================================================
        ('P004954', 'Manuel Olivera',      'PXQ'),
        ('P004115', 'Miguel Bello',        'PXQ'),
        ('P003823', 'Rodrigo Muñoz',       'PXQ'),

        -- ============================================================
        -- CHILLÁN (PXQ)
        -- ============================================================
        ('P003014', 'Andres Gatica',       'PXQ'),
        ('P002754', 'Cristian Ulloa',      'PXQ'),
        ('P004560', 'Sergio Castillo',     'PXQ'),

        -- ============================================================
        -- IQUIQUE (PXQ)
        -- ============================================================
        ('P003861', 'Esteban Gavilan',     'PXQ'),
        ('P003863', 'Gabriel Lira',        'PXQ'),
        ('P003862', 'Holguer Moy',         'PXQ'),

        -- ============================================================
        -- TALCA CF
        -- ============================================================
        ('P003677', 'Alexis Sepulveda',    'CF'),
        ('P003678', 'Bryan Rojas',         'CF'),
        ('P003679', 'Benjamin Medina',     'CF'),

        -- ============================================================
        -- TALCA PXQ
        -- ============================================================
        ('P003870', 'Alberto Sepulveda',   'PXQ'),
        ('P004947', 'Angel Guerrero',      'PXQ'),
        ('P004944', 'Carlos Oyarzun',      'PXQ'),
        ('P003869', 'Cristofer Mancilla',  'PXQ'),  -- NUEVO
        ('P004948', 'Eduardo Muñoz',       'PXQ'),
        ('P004946', 'Francisco Oyarzun',   'PXQ'),
        ('P003868', 'Juan Mondaca',        'PXQ'),
        ('P004945', 'Victor Rojas',        'PXQ'),

        -- ============================================================
        -- SANTA CRUZ (PXQ)
        -- ============================================================
        ('P004929', 'Erick Valenzuela',    'PXQ'),
        ('P004546', 'Benjamin Díaz',       'PXQ'),  -- CORRECCIÓN: BENJAMIn DÍAZ → Benjamin Díaz
        ('P004957', 'Bastian Saavedra',    'PXQ'),
        ('P004958', 'Gonzalo Vivanco',     'PXQ'),

        -- ============================================================
        -- COQUIMBO PXQ
        -- ============================================================
        ('P003865', 'Camilo Cisternas',    'PXQ'),
        ('P003884', 'Danison Tapia',       'PXQ'),
        ('P003885', 'David Mendez',        'PXQ'),
        ('P004933', 'Eduardo Gonzalez',    'PXQ'),
        ('P003867', 'Emanuel San Francisco','PXQ'),
        ('P004937', 'Jear Guerrero',       'PXQ'),
        ('P003866', 'Gonzalo Donoso',      'PXQ'),
        ('P003887', 'José Silva',          'PXQ'),  -- NUEVO
        ('P004935', 'Kevin Carrizo',       'PXQ'),
        ('P004934', 'Mirko Mendez',        'PXQ'),
        ('P003886', 'Nicolas Barrera',     'PXQ'),
        ('P004936', 'Nicolas Olguin',      'PXQ'),

        -- ============================================================
        -- COQUIMBO CF
        -- ============================================================
        ('P003827', 'Hector Huerta',       'CF'),
        ('P003828', 'Mauricio Veliz',      'CF'),
        ('P003829', 'Lexter Jorquera',     'CF'),
        ('P003830', 'Rafael Sevilla',      'CF')

    ) AS v(sap, cta, tipo) LOOP
        -- 1. Intentar actualizar si el SAP ya existe
        UPDATE control_supervisor_usuarios_sap
        SET cuenta       = r.cta,
            tipo_brigada = r.tipo
        WHERE codigo_sap = r.sap;

        -- 2. Si no existe, insertar
        IF NOT FOUND THEN
            INSERT INTO control_supervisor_usuarios_sap
                (supervisor_id, codigo_sap, cuenta, tipo_brigada, activo)
            VALUES
                (default_sup, r.sap, r.cta, r.tipo, TRUE);
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- SINCRONIZAR NOMBRES CORREGIDOS EN REGISTROS HISTÓRICOS
-- Actualiza el campo 'usuario' en control_brigadas_diario
-- donde el codigo_sap ya existe pero el nombre difiere.
-- ============================================================
UPDATE control_brigadas_diario cbd
SET usuario    = csus.cuenta,
    updated_at = CURRENT_TIMESTAMP
FROM control_supervisor_usuarios_sap csus
WHERE cbd.codigo_sap = csus.codigo_sap
  AND cbd.usuario IS DISTINCT FROM csus.cuenta;

-- ============================================================
-- SINCRONIZAR dim_tipo_brigada_usuario con los CF actualizados
-- ============================================================
INSERT INTO dim_tipo_brigada_usuario (usuario_normalizado, tipo_brigada, activo)
VALUES
    ('Alexis Sepulveda', 'CF', true),
    ('Bryan Rojas',      'CF', true),
    ('Benjamin Medina',  'CF', true),
    ('Hector Huerta',    'CF', true),
    ('Mauricio Veliz',   'CF', true),
    ('Lexter Jorquera',  'CF', true),
    ('Rafael Sevilla',   'CF', true)
ON CONFLICT (usuario_normalizado)
DO UPDATE SET tipo_brigada = EXCLUDED.tipo_brigada,
              activo       = EXCLUDED.activo,
              updated_at   = CURRENT_TIMESTAMP;

COMMIT;
