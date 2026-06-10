# Pantalla Resultados Reales por Zona - Fase 6

Desarrollada en `frontend/src/pages/ResultadosRealesZonaPage.tsx`.

## Elementos y Funcionalidad

1. **Gestión de Ruta y Estado:** Recibe la fecha operacional desde el inicio del workflow (`ReporteDiarioPage.tsx`).
2. **Encabezados:** Despliega el título y expone explícitamente en qué `fecha operacional` se está operando. 
3. **Tabla Editable Principal:** Presenta las zonas operacionales y un grid de *inputs numéricos*:
   - Total Reconexiones
   - Total Cortes
   - Corte en Poste
   - Corte en Empalme
   - Visita Fallida
4. **Restricción Intuitiva:** 
   - No es posible digitar valores negativos (al ingresar o teclear números por debajo del 0, automáticamente retornan a 0).
5. **Guardado en Masa (Bulk):** Al final de la grilla, el botón "Guardar resultados" engloba la grilla y la envía en 1 sola llamada API. El botón se bloquea (`disabled=true`) y muta visualmente a "Guardando..." durante el proceso de fetching para evitar múltiples clics indeseados.
6. **Alertas y Estado UI:** Renderiza texto explícito color Verde (Éxito) o Rojo (Error/Validaciones) confirmando la respuesta del servicio.
