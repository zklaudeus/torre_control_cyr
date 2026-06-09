# Pantalla Brigadas del día - Fase 5

Ubicada en `frontend/src/pages/BrigadasDiaPage.tsx`.

## Elementos y Funcionalidad

1. **Estado Compartido:** La vista recibe la fecha operacional desde la selección general del usuario (`fechaOperacional` pasada como prop en `App.tsx`).
2. **Selector Superior:** Existe un botón para Retroceder de vista, permitiendo retornar sin recargar la SPA.
3. **Control Central:** Un botón verde `+ Agregar brigada` despliega in-line un formulario que cambia la vista de "Grilla de Listado" a "Formulario de Inserción".
4. **Formulario:** Reacciona condicionalmente; la etiqueta del text-area "Observación" se torna color rojo indicando su condición "Requerido" cuando el select *Estado de Brigada* es "Inactiva".
5. **Grilla Principal:** Renderiza todas las brigadas en un orden lógico, incorporando un color highlight dinámico (Verde para 'Operativas', Rojo para 'Inactivas') y botones Edit/Delete por cada fila (eliminación con alerta de confirmación nativa `window.confirm`).
6. **Grilla de Resumen Visual:** Inmediatamente debajo de la tabla principal, despliega los conteos por Zona usando un fondo acentuado, procesando los datos extraídos de su endpoint particular de `/resumen`.
