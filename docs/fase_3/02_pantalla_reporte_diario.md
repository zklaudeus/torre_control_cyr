# Pantalla Reporte Diario - Fase 3

La pantalla inicial de trabajo (`ReporteDiarioPage.tsx`) centraliza las operaciones del primer paso del flujo de la beta funcional.

## Componentes y Flujo

1. **Selector de Fecha:** Se presenta un input de tipo `date` para que el usuario indique la Fecha Operacional deseada.
2. **Acción Principal ("Crear / Abrir reporte"):** Al presionar, el frontend realiza una petición POST que de forma idempotente asegura un reporte para dicha fecha.
3. **Estado del Reporte Activo:** Si la operación es exitosa, se visibiliza de inmediato un contenedor resaltado en verde mostrando el reporte activo (fecha, estado `borrador`, ID), dando confirmación visual a la usuaria.
4. **Listado de Recientes:** En la parte inferior, se visualiza el registro de todos los reportes recientes obtenidos automáticamente con una petición GET al cargar la página y después de cualquier creación.
5. **Manejo de Errores:** Incluye validaciones básicas (la fecha es requerida) y un control de errores de red o comunicación (con feedback visual en texto rojo).
