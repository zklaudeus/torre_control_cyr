-- Fix para la brigada frecuente Andres Gatica (P003014)
-- Le asignamos comuna_habitual 'Coquimbo' y nos aseguramos de que exista en control_supervisor_comunas_zonas

DO $$
DECLARE
    v_supervisor_id INTEGER;
BEGIN
    SELECT supervisor_id INTO v_supervisor_id 
    FROM control_supervisor_usuarios_sap 
    WHERE codigo_sap = 'P003014' 
    LIMIT 1;

    IF v_supervisor_id IS NOT NULL THEN
        -- Asignar comuna_habitual al usuario
        UPDATE control_supervisor_usuarios_sap 
        SET comuna_habitual = 'Coquimbo' 
        WHERE codigo_sap = 'P003014';

        -- Crear el mapeo de la comuna si no existe
        INSERT INTO control_supervisor_comunas_zonas (supervisor_id, comuna, zona_principal, activo) 
        VALUES (v_supervisor_id, 'Coquimbo', 'Coquimbo', true)
        ON CONFLICT (supervisor_id, comuna) DO NOTHING;
    END IF;
END $$;
