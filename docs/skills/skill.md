Actualizar documento `estado_proyecto_recordatorio.md` para corregir inconsistencias internas.

No modificar código.
No tocar frontend.
No tocar backend.
Solo actualizar documentación.

Problemas detectados:

1. Fase 2 aparece como “COMPLETADA EN SU MAYOR PARTE” y el resumen muestra 80%, pero si `SupervisorBitacoraView.tsx` ya consume `POST /api/supervisores/{id}/bitacora/resumen-preview`, entonces debe quedar como COMPLETADA 100%.

2. El apartado “Pendiente en Fase 2” debe eliminarse o cambiarse por “Completado”, indicando:

- Bitácora Supervisor consume el endpoint `resumen-preview`
- `calcularResumenPorZona()` ya no es el cálculo oficial
- el resumen oficial viene desde backend

3. Fase 3 ya está marcada como completada, pero Fase 6 todavía dice que `useReporteGerencial.ts` tiene 208 líneas de cálculos matemáticos pendientes. Eso está desactualizado porque `useReporteGerencial.ts` ya consume el endpoint backend `GET /api/reportes/gerencial/cyr`.

4. En Fase 6, reemplazar ese pendiente por:

- revisar código muerto residual
- eliminar funciones antiguas no usadas
- limpiar helpers frontend obsoletos
- validar que no queden cálculos duplicados en cliente

5. En el resumen de fases, actualizar:

- Fase 2 a 100% si está validada
- Fase 3 a 100%
- Próximo paso recomendado: Fase 4 — JWT y Middleware de Autenticación

6. En “Próximos Pasos Recomendados”, quitar “Completar Fase 2” si ya está listo y dejar como orden:

- Paso 1: Fase 4 — JWT y Middleware de Autenticación
- Paso 2: Fase 5 — Integrar permisos al Cleaning Engine
- Paso 3: Fase 6 — Limpieza frontend
- Paso 4: Diseño funcional de Medición y Empalme

Entrega final:

- archivo actualizado
- resumen breve de cambios
- no hacer commit salvo que se indique
