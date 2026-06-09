# Pantalla de Programación por Zona - Fase 4

El archivo principal implementado es `ProgramacionZonaPage.tsx`.

## Elementos y Funcionalidad

1. **Navegación:** Un botón "Volver a Reporte Diario" para cancelar el proceso.
2. **Contexto:** Se despliega con claridad la **fecha operacional** en la que se está trabajando.
3. **Tabla de Zonas:** 
   - Una grilla con todas las zonas activas obtenidas de base de datos a través del backend.
   - Si existen valores previos, se precargan los campos; de lo contrario se inician en cero.
   - Posee 3 inputs numéricos configurados para no aceptar valores negativos: `Reconexiones programadas`, `Asignación carga` y `Corte programado`.
4. **Acción Principal:** Un botón "Guardar programación".
5. **Mensajería:** Mensajes de estado (cargando...), errores en rojo y éxito en verde.

El flujo se integra de modo que desde el `ReporteDiarioPage` se seleccionan los parámetros iniciales y luego el botón "Ir a Programación por Zona" delega el control a esta nueva vista.
