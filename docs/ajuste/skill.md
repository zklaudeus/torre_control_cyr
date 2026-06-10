Crear módulo “Reporte Gerencial CyR” en el Dashboard.

Debe ser una vista ejecutiva tipo Power BI, no solo tabla.

Agregar al sidebar CyR:

- Reporte Gerencial

Usar fecha operacional activa.

Mostrar KPIs:

- Brigadas operativas
- Total brigadas
- Reconexiones programadas
- Reconexiones ejecutadas
- Corte programado
- Cortes ejecutados
- Cumplimiento meta %
- Cumplimiento corte %
- Visitas fallidas

Crear gráficos:

1. Barra horizontal: Cumplimiento % meta por zona.
2. Barras agrupadas: Corte programado vs corte ejecutado por zona.
3. Barras agrupadas: Reconexiones programadas vs ejecutadas por zona.
4. Barra apilada: Corte en poste vs corte en empalme por zona.
5. Barra horizontal: Promedio actividad por zona.
6. Barra simple: Visitas fallidas por zona.

Agregar tabla resumen final por zona con todos los datos.

Fórmulas:

- cortes_ejecutados = corte_en_poste + corte_en_empalme
- promedio_reconexiones = reconexiones_ejecutadas / brigadas_operativas
- promedio_cortes = cortes_ejecutados / brigadas_operativas
- promedio_actividad = (reconexiones_ejecutadas + cortes_ejecutados + visita_fallida) / brigadas_operativas
- cumplimiento_meta_pct = ((reconexiones_ejecutadas + cortes_ejecutados) / (reconexiones_programadas + corte_programado)) \* 100
- cumplimiento_corte_pct = (cortes_ejecutados / corte_programado) \* 100

Agregar botones:

- Descargar CSV o Excel
- Imprimir / Guardar PDF con window.print()

No modificar backend si no es necesario.
Calcular con endpoints actuales de brigadas, programación PXQ y programación CF.
Mantener diseño oscuro profesional.
