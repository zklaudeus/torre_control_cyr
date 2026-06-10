# Endpoint Resumen por Zona - Fase 7

## `GET /api/resumen-zona?fecha=YYYY-MM-DD`

Calcula y devuelve en tiempo real el resumen completo de la operación por zona para una fecha.

**No persiste datos.** Es puramente calculado desde las tablas existentes.

### Tablas consultadas
- `control_parametros_zona` — zonas activas y brigadas de contrato
- `control_parametros_generales` — meta diaria de cortes por brigada
- `control_programacion_zona` — reconexiones programadas, asignación de carga, corte programado
- `control_brigadas_diario` — brigadas PXQ/CF/Convenio, estados, observaciones
- `control_resultados_reales_zona` — reconexiones ejecutadas, cortes, tipos de corte, visitas fallidas

### Respuesta

```json
{
  "fecha_operacional": "2026-06-08",
  "zonas": [...],
  "total": { "zona": "TOTAL GENERAL", ... },
  "alertas": ["Faltan brigadas cargadas."]
}
```

### Alertas posibles
- "No hay zonas activas configuradas."
- "Falta programación para una o más zonas."
- "Faltan brigadas cargadas."
- "Faltan resultados reales."
