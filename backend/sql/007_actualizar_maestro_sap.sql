-- 007_actualizar_maestro_sap.sql

BEGIN;

DO $$
DECLARE
    default_sup INTEGER;
    r RECORD;
BEGIN
    -- Obtenemos el supervisor principal (Juan Muñoz o el primero que exista)
    -- para asignar a las brigadas nuevas que no estén en la base de datos.
    SELECT id INTO default_sup FROM control_supervisores WHERE nombre = 'Juan Muñoz' LIMIT 1;
    IF default_sup IS NULL THEN
        SELECT id INTO default_sup FROM control_supervisores ORDER BY id LIMIT 1;
    END IF;

    -- Iteramos sobre la lista de SAPs y Cuentas proporcionada
    FOR r IN (VALUES
        -- PXQ
        ('P003861', 'Esteban Gavilan', 'PXQ'),
        ('P003863', 'Gabriel Lira', 'PXQ'),
        ('P003862', 'Holguer Moy', 'PXQ'),
        ('P003865', 'Camilo Cisternas', 'PXQ'),
        ('P003884', 'Danison Tapia', 'PXQ'),
        ('P003885', 'David Mendez', 'PXQ'),
        ('P004933', 'Eduardo Gonzalez', 'PXQ'),
        ('P003867', 'Emanuel San Francisco', 'PXQ'),
        ('P004937', 'Jear Guerrero', 'PXQ'),
        ('P003866', 'Gonzalo Donoso', 'PXQ'),
        ('P004935', 'Kevin Carrizo', 'PXQ'),
        ('P004934', 'Mirko Mendez', 'PXQ'),
        ('P003886', 'Nicolas Barrera', 'PXQ'),
        ('P004936', 'Nicolas Olguin', 'PXQ'),
        ('P004929', 'Erick Valenzuela', 'PXQ'),
        ('P004546', 'Benjamin Díaz', 'PXQ'),
        ('P004957', 'Bastian Saavedra', 'PXQ'),
        ('P004958', 'Gonzalo Vivanco', 'PXQ'),
        ('P003870', 'Alberto Sepulveda', 'PXQ'),
        ('P004947', 'Angel Guerrero', 'PXQ'),
        ('P004944', 'Carlos Oyarzun', 'PXQ'),
        ('P004948', 'Eduardo Muñoz', 'PXQ'),
        ('P004946', 'Francisco Oyarzun', 'PXQ'),
        ('P003868', 'Juan Mondaca', 'PXQ'),
        ('P004945', 'Victor Rojas', 'PXQ'),
        ('P004952', 'Claudio Escobar', 'PXQ'),
        ('P000375', 'David Guevara', 'PXQ'),
        ('P004950', 'Erick Oyarce', 'PXQ'),
        ('P004956', 'Fabian Lopez', 'PXQ'),
        ('P004984', 'Felipe Lopez', 'PXQ'),
        ('P003383', 'Gabriel Flores', 'PXQ'),
        ('P004953', 'Ignacio Salas', 'PXQ'),
        ('P003457', 'José Bravo', 'PXQ'),
        ('P004981', 'Jose Oliva', 'PXQ'),
        ('P002752', 'Juan Medina', 'PXQ'),
        ('P003372', 'Marck Sanhueza', 'PXQ'),
        ('P004949', 'Marco Candia', 'PXQ'),
        ('P004951', 'Martin Sepulveda', 'PXQ'),
        ('P004983', 'Paulo Soto', 'PXQ'),
        ('P004542', 'Sebastian Rodriguez', 'PXQ'),
        ('P004561', 'Victor Faundez', 'PXQ'),
        ('P004954', 'Manuel Olivera', 'PXQ'),
        ('P004115', 'Miguel Bello', 'PXQ'),
        ('P003823', 'Rodrigo Muñoz', 'PXQ'),
        ('P003014', 'Andres Gatica', 'PXQ'),
        ('P002754', 'Cristian Ulloa', 'PXQ'),
        ('P004560', 'Sergio Castillo', 'PXQ'),
        ('P004955', 'Victor Gonzales', 'PXQ'),
        
        -- CF
        ('P003827', 'Hector Huerta', 'CF'),
        ('P003828', 'Mauricio Veliz', 'CF'),
        ('P003829', 'Lexter Jorquera', 'CF'),
        ('P003830', 'Rafael Sevilla', 'CF'),
        ('P003677', 'Alexis Sepulveda', 'CF'),
        ('P003678', 'Bryan Rojas', 'CF'),
        ('P003679', 'Benjamin Medina', 'CF'),

        -- Correcciones Confirmadas Extra (PXQ)
        ('P004985', 'Boris Cerro', 'PXQ')
    ) AS v(sap, cta, tipo) LOOP
        -- 1. Intentamos actualizar si el codigo SAP ya existe
        UPDATE control_supervisor_usuarios_sap
        SET cuenta = v.cta
        WHERE codigo_sap = v.sap;

        -- 2. Si no se actualizó ningún registro (no existe), lo insertamos
        IF NOT FOUND THEN
            INSERT INTO control_supervisor_usuarios_sap (supervisor_id, codigo_sap, cuenta, tipo_brigada, activo)
            VALUES (default_sup, v.sap, v.cta, v.tipo, TRUE);
        END IF;
    END LOOP;
END $$;

-- También corregir datos retroactivos mal guardados en la tabla diaria.
-- Esto asegura que, al recargar la vista, todas las filas con los códigos SAP de la lista 
-- tengan el usuario actualizado a su respectiva cuenta.
UPDATE control_brigadas_diario cbd
SET usuario = csus.cuenta
FROM control_supervisor_usuarios_sap csus
WHERE cbd.codigo_sap = csus.codigo_sap
  AND cbd.usuario != csus.cuenta;

COMMIT;
