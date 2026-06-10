# Pantalla Resumen por Zona - Fase 7

Ubicada en `frontend/src/pages/ResumenZonaPage.tsx`.

## Características

- **Solo lectura**: Ninguna celda es editable. La tabla es calculada automáticamente.
- **Tema oscuro**: Fondo `#0f172a` con tipografía clara para facilitar la lectura en pantalla.
- **Encabezado**: Muestra la fecha operacional activa y un botón "↺ Actualizar" para refrescar.
- **Alertas**: Si el servicio reporta datos faltantes, se muestran banners naranja con el mensaje correspondiente.
- **Coloreado condicional**: Los KPIs de porcentaje (% brigadas efectivas, cumplimiento corte, cumplimiento meta) se muestran en verde si ≥ 100% y en rojo si < 100%.
- **Scroll horizontal**: La tabla usa `overflow-x: auto` para acomodar todas las columnas sin romper el layout.
- **Fila total**: La fila "TOTAL GENERAL" aparece al final con fondo oscuro destacado y texto en negrita.
- **Indicador de carga**: Muestra "Calculando resumen..." mientras espera la respuesta del backend.
