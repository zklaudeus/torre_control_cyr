-- 005_supervisor_talca.sql
-- Datos semilla para Supervisor Talca Piloto

DO $$
DECLARE
    v_supervisor_id INTEGER;
BEGIN
    INSERT INTO control_supervisores (nombre, activo)
    VALUES ('Supervisor Talca Piloto', TRUE)
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_supervisor_id FROM control_supervisores WHERE nombre = 'Supervisor Talca Piloto' LIMIT 1;

    IF v_supervisor_id IS NOT NULL THEN
        -- Comunas -> Zonas
        INSERT INTO control_supervisor_comunas_zonas (supervisor_id, comuna, zona_principal, activo) VALUES
        (v_supervisor_id, 'Talca', 'Talca', true)
        ON CONFLICT (supervisor_id, comuna) DO NOTHING;

        -- CF
        INSERT INTO control_supervisor_usuarios_sap (supervisor_id, codigo_sap, cuenta, tipo_brigada, comuna_habitual, activo) VALUES
        (v_supervisor_id, 'P003677', 'Alexis Sepulveda', 'CF', 'Talca', true),
        (v_supervisor_id, 'P003678', 'Bryan Rojas', 'CF', 'Talca', true),
        (v_supervisor_id, 'P003679', 'Benjamin Medina', 'CF', 'Talca', true)
        ON CONFLICT (supervisor_id, codigo_sap) DO UPDATE SET tipo_brigada = 'CF', comuna_habitual = 'Talca', activo = true;

        -- PXQ
        INSERT INTO control_supervisor_usuarios_sap (supervisor_id, codigo_sap, cuenta, tipo_brigada, comuna_habitual, activo) VALUES
        (v_supervisor_id, 'P003870', 'Alberto Sepulveda', 'PXQ', 'Talca', true),
        (v_supervisor_id, 'P004947', 'Angel Guerrero', 'PXQ', 'Talca', true),
        (v_supervisor_id, 'P004944', 'Carlos Oyarzun', 'PXQ', 'Talca', true),
        (v_supervisor_id, 'P003869', 'Cristofer Mancilla', 'PXQ', 'Talca', true),
        (v_supervisor_id, 'P004948', 'Eduardo Muñoz', 'PXQ', 'Talca', true),
        (v_supervisor_id, 'P004946', 'Francisco Oyarzun', 'PXQ', 'Talca', true),
        (v_supervisor_id, 'P003868', 'Juan Mondaca', 'PXQ', 'Talca', true),
        (v_supervisor_id, 'P004945', 'Victor Rojas', 'PXQ', 'Talca', true)
        ON CONFLICT (supervisor_id, codigo_sap) DO UPDATE SET tipo_brigada = 'PXQ', comuna_habitual = 'Talca', activo = true;
    END IF;
END $$;
