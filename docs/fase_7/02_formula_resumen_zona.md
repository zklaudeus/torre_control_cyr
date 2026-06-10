# Fórmulas del Resumen por Zona - Fase 7

Todas las fórmulas se implementan en `resumen_zona_service.py`.

## Por zona

| Columna | Fórmula |
|---|---|
| `total_brigadas_reportadas` | PXQ + CF + Convenio |
| `porcentaje_brigadas_efectivas` | total_brigadas_reportadas / brigadas_contrato |
| `promedio_reconexiones` | total_reconexiones_ejecutadas / brigadas_pxq |
| `cumplimiento_corte_porcentaje` | total_cortes / corte_programado |
| `promedio_cortes` | total_cortes / brigadas_pxq |
| `total_actividades` | total_reconexiones_ejecutadas + total_cortes |
| `promedio_actividades` | total_actividades / total_brigadas_reportadas |
| `cumplimiento_promedio_meta` | promedio_cortes / meta_diaria_cortes_brigada |

## Protección contra división por cero

Todos los divisores se verifican antes del cálculo. Si el divisor es 0, el resultado es 0.

## Fila Total General

Los sumatorios se acumulan directamente durante el recorrido de zonas. Los porcentajes del total se calculan sobre los totales acumulados (no como promedio de zonas):

| Columna | Fórmula |
|---|---|
| `porcentaje_brigadas_efectivas` | Σtotal_brigadas_reportadas / Σbrigadas_contrato |
| `cumplimiento_corte_porcentaje` | Σtotal_cortes / Σcorte_programado |
| `promedio_cortes` | Σtotal_cortes / Σbrigadas_pxq |
| `promedio_actividades` | Σtotal_actividades / Σtotal_brigadas_reportadas |
| `cumplimiento_promedio_meta` | promedio_cortes_total / meta_diaria |

## Observación automática

Generada desde las brigadas inactivas de la zona:
- Si hay inactivas con observación: `"N brigada(s) inactiva(s): motivo1, motivo2"`
- Si hay inactivas sin observación: `"N brigada(s) inactiva(s)"`
- Si todas operativas: `""` (vacío)
