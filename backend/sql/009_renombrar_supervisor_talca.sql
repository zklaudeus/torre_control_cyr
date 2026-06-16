-- 009_renombrar_supervisor_talca.sql
-- Renombrar "Supervisor Talca Piloto" a "Jose Masso" en control_supervisores

UPDATE control_supervisores
SET nombre = 'Jose Masso'
WHERE nombre = 'Supervisor Talca Piloto';
