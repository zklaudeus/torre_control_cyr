# 03 — Reglas de Negocio

## Resumen por Zona

1. El Resumen por Zona no es una pantalla editable.
2. Es una vista calculada automáticamente a partir de datos ingresados en otras pantallas.

## Campos Manuales

1. En la pantalla "Programación por zona", solo se permiten 3 campos manuales por zona:
   - Reconexiones programadas
   - Asignación de carga total en bandeja
   - Corte programado

## Cálculo de Brigadas

1. Las brigadas se contabilizan desde la pantalla "Brigadas del día".
2. **Total B. reportadas** = Brigadas PXQ + Brigadas CF.
3. El Porcentaje de Brigadas Efectivas se calcula comparando el Total B. reportadas contra el parámetro "Brigadas por Contrato" (Brigadas x Ctto).

## Parámetros CYR

1. Los Parámetros Básicos CYR (como "Brigadas por contrato" o "Meta diaria cortes por brigada") alimentan los cálculos de metas y efectividad.
2. Para la beta, estos parámetros pueden cargarse desde una configuración inicial (seed), sin necesidad de pantalla de edición.
3. La meta diaria de cortes por brigada es fija (30) para la beta y no varía por zona ni mes.

## Resultados Reales

1. Los resultados reales provienen desde Neon o la app actual.
2. Mientras la integración no esté disponible, se permitirá una carga temporal manual.

## Prevención de Errores

1. Las fórmulas automáticas (especialmente promedios y porcentajes) deben estar protegidas contra errores de división por cero en caso de no haber brigadas reportadas.
