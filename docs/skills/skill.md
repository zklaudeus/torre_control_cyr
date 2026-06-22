# Skill — Fase 3B: Reporte Gerencial CyR desde Backend

Actúa como backend senior, frontend engineer y QA.

Modo ahorro de créditos y ejecución controlada.

No analices todo el proyecto.
No hagas refactor masivo.
No hagas merge.
No toques Bitácora Supervisor.
No toques Medición.
No toques Empalme.
No cambies reglas PXQ/CF globales.
No cambies roles ni permisos.
No modifiques base de datos salvo que sea estrictamente necesario.

## Contexto

Según el documento de estado del proyecto:

- Fase 1 está completada.
- Fase 2 está prácticamente completada.
- Fase 3 está parcial.
- Ya existen servicios backend avanzados:
  - `ResumenZonaService`
  - `ResultadoRealZonaService`

- El problema pendiente es que `useReporteGerencial.ts` todavía calcula KPIs gerenciales en frontend y usa `meta_diaria = 30` hardcodeado.

## Objetivo

Mover el cálculo del Reporte Gerencial CyR al backend.

El frontend debe dejar de calcular KPIs gerenciales y pasar a consumir un endpoint backend.

## Rama de trabajo

Antes de modificar:

```bash
git status
git checkout -b feature/backend-reporte-gerencial-cyr
git branch
```

Si la rama ya existe, usarla.

## Alcance exacto

Crear o reutilizar endpoint backend para entregar el Reporte Gerencial CyR ya calculado por fecha operacional.

Endpoint recomendado:

```txt
GET /api/reportes/gerencial/cyr?fecha_operacional=YYYY-MM-DD
```

O usar una ruta equivalente si la arquitectura actual ya tiene `/api/resumen-zona/`.

## Backend

Revisar y reutilizar si corresponde:

```txt
backend/app/services/resumen_zona_service.py
backend/app/services/resultado_real_zona_service.py
backend/app/api/routes/
backend/app/schemas/
```

Crear solo si hace falta:

```txt
backend/app/services/reporte_gerencial_cyr_service.py
backend/app/schemas/reporte_gerencial_cyr.py
backend/app/api/routes/reportes.py
```

El backend debe calcular por zona:

- zona
- brigadas_operativas
- total_brigadas
- reconexiones_programadas
- reconexiones_ejecutadas
- promedio_reconexiones
- corte_programado
- cortes_ejecutados
- promedio_cortes
- promedio_actividad
- corte_en_poste
- corte_en_empalme
- corte_fuera_de_rango si existe
- visitas_fallidas
- cumplimiento_meta_pct
- cumplimiento_corte_pct

También debe entregar fila total general.

## Fórmulas

Usar estas reglas:

```txt
cortes_ejecutados = corte_en_poste + corte_en_empalme + corte_fuera_de_rango
```

Si `corte_fuera_de_rango` no existe todavía en el modelo, tratarlo como 0 sin romper.

```txt
promedio_reconexiones = reconexiones_ejecutadas / brigadas_operativas
promedio_cortes = cortes_ejecutados / brigadas_operativas
promedio_actividad = (reconexiones_ejecutadas + cortes_ejecutados) / brigadas_operativas
cumplimiento_meta_pct = promedio_actividad / meta_promedio_actividad * 100
cumplimiento_corte_pct = cortes_ejecutados / corte_programado * 100
```

Si el divisor es 0, devolver 0.

No usar `meta_diaria = 30` hardcodeado en frontend.
La meta debe venir desde backend, configuración o servicio existente.

## Response esperado

```json
{
  "fecha_operacional": "2026-06-18",
  "zonas": [
    {
      "zona": "Talca",
      "brigadas_operativas": 7,
      "total_brigadas": 10,
      "reconexiones_programadas": 20,
      "reconexiones_ejecutadas": 15,
      "promedio_reconexiones": 2.14,
      "corte_programado": 120,
      "cortes_ejecutados": 90,
      "promedio_cortes": 12.86,
      "promedio_actividad": 15,
      "corte_en_poste": 50,
      "corte_en_empalme": 40,
      "corte_fuera_de_rango": 0,
      "visitas_fallidas": 3,
      "cumplimiento_meta_pct": 50,
      "cumplimiento_corte_pct": 75
    }
  ],
  "total": {
    "zona": "TOTAL",
    "brigadas_operativas": 0,
    "total_brigadas": 0,
    "reconexiones_programadas": 0,
    "reconexiones_ejecutadas": 0,
    "promedio_reconexiones": 0,
    "corte_programado": 0,
    "cortes_ejecutados": 0,
    "promedio_cortes": 0,
    "promedio_actividad": 0,
    "corte_en_poste": 0,
    "corte_en_empalme": 0,
    "corte_fuera_de_rango": 0,
    "visitas_fallidas": 0,
    "cumplimiento_meta_pct": 0,
    "cumplimiento_corte_pct": 0
  }
}
```

## Frontend

Revisar principalmente:

```txt
frontend/src/hooks/useReporteGerencial.ts
frontend/src/components/reportes/
frontend/src/api/
frontend/src/types/
```

Cambios esperados:

- Crear función API para consumir el nuevo endpoint.
- Simplificar `useReporteGerencial.ts`.
- El hook ya no debe calcular KPIs principales en frontend.
- El hook debe recibir datos ya calculados desde backend.
- Mantener la UI actual del Reporte Gerencial.
- Mantener botones de imprimir/descargar si ya existen.
- Mantener formato visual actual.
- No romper Resumen General.
- No romper Resumen por Zona.
- No tocar Bitácora Supervisor.

## Lo que debe quedar en frontend

Solo debe quedar:

- estado de carga
- manejo de errores
- filtros visuales si existen
- renderizado de cards
- renderizado de tabla
- formato visual de números
- descarga CSV si ya estaba implementada

## Lo que NO debe quedar en frontend

Eliminar o dejar sin uso oficial:

- cálculo de promedios gerenciales
- cálculo de cumplimiento
- suma manual por zona
- `meta_diaria = 30` hardcodeado
- cruces complejos entre brigadas y programación

## Validaciones manuales

Probar:

1. Abrir Reporte Gerencial con una fecha que tenga datos.
2. Verificar que carguen KPIs por zona.
3. Verificar que exista fila TOTAL.
4. Comparar visualmente contra valores anteriores.
5. Verificar que no se rompa Resumen General.
6. Verificar que no se rompa Bitácora Supervisor.
7. Verificar que fecha sin datos no rompa pantalla y devuelva ceros o lista vacía controlada.

## Validaciones técnicas

Ejecutar:

```bash
git status
npm run build
```

Si existe backend test:

```bash
pytest
```

o el comando disponible del proyecto.

## Restricciones

No hacer merge.
No tocar módulos no relacionados.
No cambiar diseño visual salvo ajuste mínimo necesario.
No duplicar cálculos en frontend y backend.
No eliminar código antiguo hasta validar que el endpoint funciona.
No modificar BD salvo que sea estrictamente necesario.

## Entrega final

Entregar solo:

- rama activa
- archivos modificados
- endpoint creado o reutilizado
- request/response final
- cambios realizados en `useReporteGerencial.ts`
- comandos ejecutados
- resultado de build
- problemas encontrados
- pruebas manuales sugeridas
- si está listo para commit o no

No mostrar código completo salvo archivo nuevo.
No entregar explicación larga.
