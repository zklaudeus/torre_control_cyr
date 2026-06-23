# Diseño técnico del MVP — Productividad y Rendimiento Técnico

**Proyecto:** Torre de Control CyR / EISESA  
**Fecha:** 23 de junio de 2026  
**Estado:** diseño previo a implementación  
**Documento funcional de referencia:** `docs/reglas_productividad_rendimiento.md`  
**Alcance de esta etapa:** definir el diseño; no crear tablas, migraciones, endpoints ni cambios de frontend todavía.

## 1. Objetivo del MVP

Construir una vertical completa que permita consultar el rendimiento real de cada cuenta SAP usando la Bitácora del Supervisor y los resultados operacionales ya procesados por la plataforma.

El MVP debe responder de forma confiable:

- qué cuentas SAP estuvieron operativas en cada día;
- cuál fue su cortes productivos diaria;
- cuál fue su meta y porcentaje de cumplimiento;
- cuál es su promedio, mejor resultado y acumulado;
- cuántos días consecutivos lleva bajo 50% o cumpliendo meta;
- cuál es su estado de rendimiento;
- si debe ingresar a Fase 2;
- qué cuentas requieren revisión de Torre de Control.

La solución debe conservar los datos utilizados para cada cálculo y permitir reproducir el resultado histórico.

## 2. Alcance funcional

### 2.1 Incluido en el MVP

- Cuenta SAP como unidad productiva.
- Calendario evaluable de lunes a viernes.
- Presencia en la Bitácora diaria cerrada como fuente de operatividad.
- Ausencia en Bitácora como día no operativo/no evaluable.
- Tipos PXQ y CF.
- Meta PXQ 25 y meta CF 6.
- Cortes productivos: poste + empalme + fuera de rango.
- Exclusión de desmantelamiento.
- Cortes productivos.
- Cumplimiento diario y acumulado.
- Promedio, máximo, acumulado y ranking.
- Estados Crítico, En recuperación, Estable y Alto desempeño.
- Rachas de bajo 50% y cumplimiento de meta.
- Activación automática de Fase 2.
- Salida de fase con aprobación de Torre de Control.
- Historial de cálculos y transiciones.
- Filtros por cuenta SAP, supervisor, zona, tipo, estado y período.

### 2.2 Fuera del MVP inicial

- Disparador automático de Fase 3.
- Tratamiento diferente de visitas fallidas según causa.
- Cursos/capacitaciones y vencimientos.
- Semáforos de seguridad, calidad, protocolos y atención al cliente sin una fuente de datos real.
- Recomendaciones automáticas complejas.
- Predicciones o inteligencia artificial.
- Reemplazo completo de tablas operacionales actuales.
- Eliminación inmediata de mocks o código legacy antes de validar paridad.

## 3. Decisiones técnicas principales

1. `control_brigadas_diario` seguirá siendo la fuente operacional de la lista diaria y resultados mientras se construye el MVP.
2. La cuenta SAP técnica corresponde inicialmente a `control_brigadas_diario.codigo_sap`; `usuario` se usa solo como nombre visible.
3. Se agregará una cabecera de Bitácora para saber si la lista del supervisor está abierta o cerrada.
4. La productividad se calculará y persistirá por cuenta SAP + fecha operacional.
5. Los cálculos serán idempotentes: recalcular los mismos datos no generará duplicados.
6. Las metas y reglas tendrán versión/vigencia para no cambiar silenciosamente la historia.
7. Las métricas diarias y el estado vigente estarán separados.
8. Las transiciones de estado/fase tendrán historial inmutable.
9. No se expondrán endpoints de productividad sin autenticación.
10. Fase 3 permanecerá manual/no automatizada hasta cerrar sus reglas.

## 4. Mapeo de fuentes actuales

| Concepto MVP | Fuente actual | Campo actual | Observación |
|---|---|---|---|
| Cuenta SAP | `control_brigadas_diario` | `codigo_sap` | Clave técnica del MVP. Debe validarse contra maestro SAP. |
| Nombre visible | `control_brigadas_diario` / maestro | `usuario` / `cuenta` | No usar como identidad. |
| Fecha | `control_brigadas_diario` | `fecha_operacional` | Interpretada en calendario operacional Chile. |
| Zona | `control_brigadas_diario` | `zona` | Texto legacy; posteriormente debe migrar a FK. |
| Tipo | `control_brigadas_diario` | `tipo_brigada` | PXQ o CF. |
| Patente | `control_brigadas_diario` | `patente` | Mutable; no identifica la brigada. |
| Presencia en Bitácora | Existencia de fila diaria | fila por fecha+SAP | Solo es definitiva cuando la Bitácora esté cerrada. |
| Carga de brigada | `control_brigadas_diario` | `corte_programado` | En el flujo supervisor representa la carga/cortes asignados a la cuenta. No determina evaluabilidad. |
| Corte poste | `control_brigadas_diario` | `corte_en_poste` | Suma productividad. |
| Corte empalme | `control_brigadas_diario` | `corte_en_empalme` | Suma productividad, pero hoy puede incluir desmantelamientos. |
| Fuera de rango | `control_brigadas_diario` | `corte_fuera_de_rango` | Suma productividad y debe dejar de contar también como reconexión. |
| Fallidas | `control_brigadas_diario` | `visita_fallida` | Se resta de cortes productivos. |
| Supervisor | Maestro SAP/comuna | `supervisor_id` | La tabla diaria no lo persiste actualmente; debe quedar explícito. |
| Estado del día | `reportes_cyr` | `estado` | No representa de forma suficiente el cierre de cada supervisor. |

## 5. Brechas de datos que deben resolverse

### 5.1 Cierre de Bitácora

Hoy la ausencia de una cuenta puede significar permiso/licencia o simplemente que el supervisor aún no termina de cargar la lista. El cálculo solo puede interpretar ausencias después del cierre explícito.

Se necesita una cabecera diaria por supervisor con estado:

```text
BORRADOR -> CERRADA
```

Una reapertura, si se permite, debe registrar actor, fecha y motivo, e invalidar/recalcular las métricas afectadas.

### 5.2 Desmantelamiento mezclado con empalme

El motor actual suma desmantelamiento dentro de `corte_en_empalme`. Como negocio confirmó que no contabiliza, el MVP necesita separar ambas categorías al importar.

Consecuencias:

- para datos nuevos se debe persistir `desmantelamiento` por separado;
- para historia ya agregada no es posible separar con certeza sin reprocesar los Excel originales;
- el período histórico habilitado debe depender de la disponibilidad de archivos fuente.

### 5.3 Cuenta SAP y duplicados

Debe existir una sola evaluación por cuenta SAP y fecha. Antes de crear la restricción se debe auditar:

- SAP nulos;
- SAP duplicados el mismo día;
- una misma cuenta asignada a más de un supervisor;
- variaciones de nombre para el mismo SAP;
- cambio de tipo de brigada sin vigencia definida.

### 5.4 Supervisor diario

`control_brigadas_diario` no tiene `supervisor_id`. El MVP debe registrar el supervisor responsable al momento de crear la lista, no inferirlo después desde el maestro actual.

## 6. Modelo de datos mínimo propuesto

Los nombres son tentativos y se validarán antes de crear migraciones.

### 6.1 `tecnicos`

Maestro canónico de cuentas SAP.

| Columna | Tipo sugerido | Regla |
|---|---|---|
| `id` | `bigserial` | PK. |
| `cuenta_sap` | `varchar(50)` | Única, obligatoria; corresponde inicialmente al `codigo_sap` actual. |
| `nombre` | `varchar(150)` | Solo presentación. |
| `activo` | `boolean` | Default `true`. |
| `created_at`, `updated_at` | `timestamptz` | Auditoría técnica. |

### 6.2 `bitacoras_supervisor_diarias`

Cabecera que vuelve confiable la presencia/ausencia.

| Columna | Tipo sugerido | Regla |
|---|---|---|
| `id` | `bigserial` | PK. |
| `fecha_operacional` | `date` | Obligatoria. |
| `supervisor_id` | `bigint` | FK a supervisor. |
| `estado` | `varchar(20)` | `BORRADOR` o `CERRADA`. |
| `cerrada_at` | `timestamptz` | Nulo mientras esté abierta. |
| `cerrada_por_usuario_id` | `bigint` | Actor del cierre. |
| `reabierta_at`, `reabierta_por` | nullable | Si se autoriza reapertura. |
| `motivo_reapertura` | `text` | Obligatorio al reabrir. |

Restricción única: `fecha_operacional + supervisor_id`.

Las filas de `control_brigadas_diario` deben vincularse posteriormente mediante `bitacora_supervisor_diaria_id` y conservar `supervisor_id` como snapshot.

### 6.3 `reglas_productividad`

Versiona metas y umbrales.

| Columna | Tipo sugerido | Regla |
|---|---|---|
| `id` | `bigserial` | PK. |
| `version` | `integer` | Versión creciente. |
| `tipo_brigada` | `varchar(10)` | PXQ o CF. |
| `meta_diaria` | `integer` | PXQ 25; CF 6. |
| `critico_max` | `integer` | PXQ 12; CF 2. |
| `recuperacion_min/max` | `integer` | PXQ 13/24; CF 3/5. |
| `estable_min/max` | `integer nullable` | PXQ 25/29; CF 6/sin máximo. |
| `dias_alto_desempeno` | `integer` | 3. |
| `dias_fase_2` | `integer` | 3. |
| `vigente_desde`, `vigente_hasta` | `date` | Evita reescribir historia. |
| `activo` | `boolean` | Solo una versión vigente por tipo/fecha. |

### 6.4 `productividad_diaria`

Snapshot reproducible por cuenta SAP y fecha.

| Columna | Tipo sugerido | Regla |
|---|---|---|
| `id` | `bigserial` | PK. |
| `fecha_operacional` | `date` | Parte de unicidad. |
| `tecnico_id` | `bigint` | FK a `tecnicos`. |
| `brigada_diaria_id` | `bigint nullable` | FK al registro legacy cuando estuvo presente. |
| `bitacora_id` | `bigint` | Cabecera cerrada usada para evaluar. |
| `supervisor_id` | `bigint` | Snapshot del responsable. |
| `zona` / `zona_id` | según etapa | Snapshot de zona. |
| `tipo_brigada` | `varchar(10)` | PXQ o CF. |
| `presente_bitacora` | `boolean` | Fuente de operatividad. |
| `evaluable` | `boolean` | Solo lunes–viernes y Bitácora cerrada/presente. |
| `motivo_no_evaluable` | `varchar(50)` | Ej. `AUSENTE_BITACORA`, `FIN_SEMANA`, `DATOS_INCOMPLETOS`. |
| `carga_asignada` | `integer nullable` | Informativa; no tiene mínimo. |
| `corte_poste` | `integer` | >= 0. |
| `corte_empalme` | `integer` | >= 0, sin desmantelamiento. |
| `corte_fuera_rango` | `integer` | >= 0. |
| `desmantelamiento` | `integer` | Se registra pero no suma. |
| `visitas_fallidas` | `integer` | >= 0. |
| `cortes_efectivos` | `integer` | Poste + empalme + fuera de rango. |
| `productividad_neta` | `integer` | `max(0, cortes_efectivos - fallidas)`. |
| `meta_aplicada` | `integer` | Snapshot de regla. |
| `cumplimiento_pct` | `numeric(7,2)` | Cortes productivos / meta × 100. |
| `bajo_50` | `boolean` | Facilita rachas auditables. |
| `cumple_meta` | `boolean` | Cortes productivos >= meta. |
| `regla_productividad_id` | `bigint` | Versión utilizada. |
| `calculado_at` | `timestamptz` | Timestamp. |
| `estado_calculo` | `varchar(20)` | `VALIDO`, `PENDIENTE`, `ERROR`. |

Restricción única: `fecha_operacional + tecnico_id`.

Se recomienda crear fila no evaluable para las cuentas activas del supervisor que no aparecen en la Bitácora cerrada. Esto permite explicar la ausencia sin incorporarla a promedios ni rachas. La causa específica permiso/licencia no se inventa: se registra inicialmente como `AUSENTE_BITACORA`.

### 6.5 `rendimiento_tecnico_actual`

Snapshot de consulta rápida.

| Columna | Contenido |
|---|---|
| `tecnico_id` | PK/FK. |
| `estado_actual` | Crítico, En recuperación, Estable o Alto desempeño. |
| `fase_actual` | 1, 2 o 3. Fase 3 no se activa automáticamente en MVP. |
| `dias_consecutivos_bajo_50` | Racha vigente. |
| `dias_consecutivos_cumple_meta` | Racha para Alto desempeño. |
| `productividad_promedio` | Ventana solicitada. |
| `mejor_productividad` | Máximo y fecha. |
| `ultima_fecha_evaluable` | Último día usado. |
| `regla_productividad_id` | Versión vigente usada. |
| `updated_at` | Último recálculo. |

### 6.6 `historial_rendimiento_tecnico`

| Columna | Contenido |
|---|---|
| `id` | PK. |
| `tecnico_id` | Cuenta afectada. |
| `fecha_evento` | Momento de transición. |
| `estado_anterior/nuevo` | Trazabilidad de estado. |
| `fase_anterior/nueva` | Trazabilidad de fase. |
| `motivo` | Regla o aprobación. |
| `productividad_diaria_id` | Evidencia disparadora. |
| `automatico` | Regla o acción humana. |
| `usuario_actor_id` | Obligatorio para aprobaciones/overrides. |
| `version_regla` | Reproducibilidad. |

### 6.7 `recalculos_productividad`

Audita ejecuciones manuales o por rango: solicitante, fechas, versión, estado, cantidad de filas, errores e inicio/fin. Puede omitirse en la primera migración si el recálculo se limita estrictamente a un día y queda registrado en logs estructurados.

## 7. Relaciones

```text
supervisor
  └── bitacora_supervisor_diaria (fecha, estado)
        └── control_brigadas_diario (lista de cuentas presentes)

tecnico (cuenta SAP)
  ├── productividad_diaria (una por fecha)
  ├── rendimiento_tecnico_actual (una vigente)
  └── historial_rendimiento_tecnico (muchas transiciones)

reglas_productividad
  └── productividad_diaria (versión utilizada)
```

## 8. Algoritmo de cálculo

### 8.1 Cálculo diario

1. Recibir `fecha_operacional` y supervisor/alcance.
2. Verificar que la fecha sea lunes–viernes.
3. Verificar que la Bitácora del supervisor esté `CERRADA`.
4. Obtener todas las cuentas activas asignadas al supervisor.
5. Compararlas con las filas de `control_brigadas_diario` de la fecha.
6. Para cada cuenta presente:
   - marcar `presente_bitacora=true`, `evaluable=true`;
   - resolver tipo PXQ/CF y regla vigente;
   - leer poste, empalme, fuera de rango y fallidas;
   - excluir desmantelamiento;
   - calcular cortes productivos;
   - calcular cortes productivos;
   - calcular cumplimiento y flags.
7. Para cada cuenta activa ausente de la lista cerrada:
   - crear/actualizar snapshot `evaluable=false`;
   - usar motivo `AUSENTE_BITACORA`;
   - no sumar cero ni modificar rachas productivas.
8. Hacer upsert por fecha+cuenta dentro de una transacción.
9. Recalcular rachas y rendimiento actual desde días evaluables ordenados.
10. Crear historial solo si cambia estado/fase.

### 8.2 Fórmulas

```text
cortes_efectivos =
  corte_poste + corte_empalme + corte_fuera_rango

productividad_neta =
  max(0, cortes_efectivos - visitas_fallidas)

cumplimiento_pct =
  productividad_neta / meta_aplicada * 100

bajo_50 =
  cumplimiento_pct < 50

cumple_meta =
  productividad_neta >= meta_aplicada
```

### 8.3 Estados

**PXQ**

- Crítico: 0–12.
- En recuperación: 13–24.
- Estable: 25–29.
- Alto desempeño: cortes productivos >= 25 durante 3 días evaluables consecutivos.

**CF**

- Crítico: 0–2.
- En recuperación: 3–5.
- Estable: >= 6 mientras no complete la racha.
- Alto desempeño: cortes productivos >= 6 durante 3 días evaluables consecutivos.

**Borde pendiente PXQ:** el negocio decidió conservar el rango Estable 25–29 y no agregar un rango provisional. Antes de codificar el semáforo debe definirse el estado mostrado para un resultado individual >= 30 cuando todavía no completa los 3 días de Alto desempeño. Esto no bloquea el almacenamiento de métricas, pero sí el estado visual final.

### 8.4 Rachas

- Solo se recorren filas `evaluable=true`.
- Sábado y domingo no crean filas evaluables ni rompen la secuencia.
- Una cuenta ausente no suma un día malo.
- Está pendiente decidir si una ausencia entre dos días evaluables suspende o reinicia la racha.
- Tres días evaluables consecutivos con `bajo_50=true` activan Fase 2.
- Tres días evaluables consecutivos con `cumple_meta=true` activan Alto desempeño.

### 8.5 Fases

- Toda cuenta comienza en Fase 1.
- El sistema puede subir automáticamente de Fase 1 a Fase 2.
- No puede bajar automáticamente de fase.
- Torre de Control aprueba la salida con motivo obligatorio.
- Fase 3 no se calcula automáticamente en el MVP.
- Toda transición crea historial.

## 9. Momentos de recálculo

### 9.1 Al cerrar Bitácora

Se fija la lista de cuentas operativas/no operativas. El primer cálculo puede quedar en cero hasta recibir resultados.

### 9.2 Después de procesar Excel operacional

El motor ya actualiza resultados por fecha+SAP. Al completar exitosamente la importación debe recalcular solo las cuentas afectadas.

### 9.3 Cierre del día

Un proceso controlado consolida el día y actualiza estados/rachas. No se necesita Redis/Celery para un cálculo diario pequeño; sí se debe evitar ejecutar recálculos históricos largos dentro de una petición web.

### 9.4 Recálculo manual

Torre de Control/Admin puede recalcular una fecha o rango limitado. Debe registrarse actor, versión y resultado. Nunca debe duplicar filas ni borrar historial sin generar una nueva transición/explicación.

## 10. Servicios backend propuestos

```text
ProductividadCalculator
  - calcular_cortes_efectivos(...)
  - calcular_productividad_neta(...)
  - calcular_cumplimiento(...)

CalendarioProductividadPolicy
  - es_dia_operativo(fecha)
  - es_evaluable(bitacora, presencia)

RendimientoPolicy
  - clasificar_estado_diario(...)
  - calcular_rachas(...)
  - resolver_estado_actual(...)
  - debe_activar_fase_2(...)

ProductividadService
  - recalcular_fecha(...)
  - recalcular_cuentas(...)
  - obtener_resumen_tecnico(...)
  - obtener_ranking(...)

FaseRendimientoService
  - activar_fase_2_automatica(...)
  - aprobar_cambio_fase(...)
```

Las políticas y calculadoras deben ser funciones puras con pruebas unitarias. Los repositorios solo consultan/persisten.

## 11. Endpoints del MVP

Se conserva el estilo actual `/api` para minimizar cambios. El versionado `/api/v1` puede introducirse en una etapa transversal posterior.

| Método y ruta | Objetivo | Roles | Cálculo |
|---|---|---|---|
| `GET /api/productividad/tecnicos` | Listado paginado con estado y KPIs resumidos. | TC/Admin/Gerencia; Supervisor solo propios | Agregado o snapshot |
| `GET /api/productividad/tecnicos/{cuenta_sap}/resumen` | Ficha del período. | Según alcance | Sí |
| `GET /api/productividad/tecnicos/{cuenta_sap}/historial` | Serie diaria evaluable/no evaluable. | Según alcance | No, lectura snapshot |
| `GET /api/productividad/tecnicos/{cuenta_sap}/estados` | Historial de estados/fases. | Según alcance | No |
| `GET /api/productividad/ranking` | Ranking por período, zona y tipo. | TC/Admin/Gerencia | Agregado |
| `GET /api/productividad/alertas` | Cuentas críticas o candidatas a Fase 2. | TC/Admin/Supervisor propio | Agregado |
| `GET /api/productividad/zonas/{zona}` | Resumen por zona. | Según alcance | Agregado |
| `GET /api/productividad/reglas` | Metas/umbrales vigentes. | Autenticados | No |
| `POST /api/productividad/recalcular` | Recalcular fecha/rango autorizado. | TC/Admin | Sí |
| `PATCH /api/productividad/tecnicos/{cuenta_sap}/fase` | Aprobar cambio/salida de fase. | Torre de Control/Admin | Validación y auditoría |
| `POST /api/supervisores/me/bitacora/cerrar` | Cerrar lista diaria propia. | Supervisor | Dispara evaluación inicial |
| `POST /api/supervisores/{id}/bitacora/reabrir` | Reabrir con motivo. | TC/Admin | Invalida/recalcula |

### 11.1 Respuesta resumida esperada

```json
{
  "cuenta_sap": "P003014",
  "nombre": "Nombre visible",
  "zona": "Chillán",
  "tipo_brigada": "PXQ",
  "estado": "En recuperación",
  "fase": 1,
  "productividad_ultima": 18,
  "productividad_promedio": 20.5,
  "mejor_productividad": 28,
  "dias_evaluables": 10,
  "racha_bajo_50": 0,
  "racha_cumple_meta": 1,
  "regla_version": 1
}
```

### 11.2 Historial diario esperado

Cada fila debe devolver como mínimo fecha, presencia, evaluable, motivo, tipo, meta, cortes por tipo, fallidas, cortes productivos, cumplimiento, flags y versión de regla.

## 12. Autorización

| Rol | Alcance propuesto |
|---|---|
| `supervisor` | Solo cuentas SAP asignadas y días bajo su responsabilidad. No cambia fases. |
| `torre_control` | Lee toda la operación, recalcula y aprueba salida/cambio de fase. |
| `admin` / `superadmin` | Administración completa y soporte. |
| `gerencia` | Lectura global, ranking y reportes; ninguna mutación. |

El backend debe aplicar el alcance. Ocultar botones en React no es una medida de seguridad.

## 13. Casos de prueba de negocio

| ID | Escenario | Entrada principal | Resultado esperado |
|---|---|---|---|
| CP-01 | PXQ normal | Poste 10, empalme 8, FDR 2, fallidas 3 | Efectivos 20; neta 17; 68%; En recuperación. |
| CP-02 | Piso cero | Efectivos 4, fallidas 9 | Neta 0; 0%; Crítico. |
| CP-03 | Desmantelamiento | Solo 5 desmantelamientos | Efectivos 0; neta 0. |
| CP-04 | Fuera de rango | FDR 4 | Suma 4 cortes; no suma reconexión. |
| CP-05 | CF recuperación | Neta 4 | En recuperación. |
| CP-06 | CF estable inicial | Neta 6, primera fecha | Estable; racha meta 1. |
| CP-07 | CF alto desempeño | Neta >= 6 en 3 evaluables consecutivos | Alto desempeño; racha 3. |
| CP-08 | PXQ estable | Neta 27 | Estable según rango aprobado. |
| CP-09 | Cuenta ausente | Bitácora cerrada sin esa cuenta | No evaluable; motivo `AUSENTE_BITACORA`; no suma cero. |
| CP-10 | Bitácora abierta | Cuenta aún no cargada | No calcular ausencia ni estado. |
| CP-11 | Carga cero | Cuenta presente, carga 0 | Evaluable; productividad según resultados. |
| CP-12 | Fin de semana | Cuenta presente un sábado | No evaluable. |
| CP-13 | Racha con fin de semana | Jueves, viernes y lunes cumplen meta | Tres evaluables consecutivos; Alto desempeño. |
| CP-14 | Fase 2 PXQ | Tres evaluables seguidos con neta <= 12 | Fase 2 automática una sola vez. |
| CP-15 | Fase 2 CF | Tres evaluables seguidos con neta <= 2 | Fase 2 automática una sola vez. |
| CP-16 | Salida fase | Usuario no TC intenta bajar fase | 403; sin cambios. |
| CP-17 | Cambio patente | Mismo SAP/fecha, patente nueva | Misma evaluación diaria. |
| CP-18 | Cambio carga | Mismo SAP/fecha, carga modificada | Misma evaluación; snapshot actualizado y auditable. |
| CP-19 | Duplicado | Dos filas para SAP/fecha | Rechazo o conciliación explícita; nunca doble productividad. |
| CP-20 | Recálculo repetido | Ejecutar dos veces mismos datos | Una fila diaria; mismo resultado. |
| CP-21 | Cambio de regla | Recalcular con versión nueva autorizada | Resultado vinculado a nueva versión; historia explicable. |
| CP-22 | PXQ 30+ sin racha | Neta 31, primer día | Pendiente de definición de estado; métrica se persiste correctamente. |

## 14. Pruebas técnicas

### Unitarias

- Fórmulas y piso cero.
- Clasificación PXQ/CF.
- Calendario lunes–viernes.
- Rachas saltando fin de semana.
- Ausencias no evaluables.
- Activación Fase 2.
- Alto desempeño consecutivo.
- Idempotencia lógica.

### Integración

- Cierre de Bitácora crea snapshots correctos.
- Importación Excel recalcula cuentas afectadas.
- Transacción completa o rollback.
- Restricción única fecha+cuenta.
- Permisos por rol/supervisor.
- Historial de transición.

### Paridad con datos reales

- Seleccionar fechas reales representativas de PXQ y CF.
- Calcular manualmente con negocio.
- Comparar plataforma fila por fila.
- Documentar diferencias por desmantelamiento histórico.
- Obtener aprobación antes de retirar mocks.

## 15. Diseño frontend del MVP

### Flujo de datos

```text
RendimientoTecnicoDashboardView
  └── useProductividadTecnicos(filtros)
        └── productividad.api.ts
              └── endpoints backend
```

### Responsabilidades

- Selector: consume técnicos reales y filtros.
- KPI cards: recibe DTO de resumen; no calcula reglas.
- Semáforo: muestra estado devuelto por backend.
- Fase: muestra fase/historial; cambio solo con permiso.
- Hallazgos: en MVP muestra alertas derivadas de productividad.
- Cursos y semáforos sin fuente: ocultar o marcar fuera de alcance, no mantener datos ficticios en producción.
- Colores permanecen en frontend; umbrales y estados vienen del backend.

### Archivos probables de la implementación futura

- `frontend/src/api/productividad.api.ts`
- `frontend/src/hooks/useProductividadTecnicos.ts`
- `frontend/src/types/productividad.types.ts`
- componentes de `frontend/src/components/rendimiento/`
- `frontend/src/data/rendimientoTecnico.mock.ts` solo se retira después de paridad.

## 16. Estructura backend propuesta

```text
backend/app/modules/productividad/
  routes.py
  schemas.py
  service.py
  calculator.py
  policies.py
  repository.py
  models.py

backend/tests/productividad/
  test_calculator.py
  test_policies.py
  test_service.py
  test_routes.py
```

Si se mantiene temporalmente la estructura plana actual, las mismas responsabilidades deben conservarse separadas aunque los archivos vivan en `services/`, `repositories/`, `schemas/` y `api/routes/`.

## 17. Orden de implementación recomendado

### Etapa A — datos y seguridad previa

- Auditar duplicados SAP/fecha.
- Confirmar mapeo cuenta SAP = `codigo_sap`.
- Resolver secreto JWT, credenciales y bypass local antes de producción.
- Respaldar base real.

### Etapa B — migraciones aditivas

- Crear tablas nuevas sin borrar legacy.
- Agregar supervisor/bitácora a filas diarias.
- Insertar reglas versión 1.
- Separar desmantelamiento para datos nuevos.

### Etapa C — dominio backend

- Implementar calculator/policies.
- Crear pruebas unitarias con CP-01…CP-22.
- Implementar persistencia idempotente.
- Implementar cierre de Bitácora.

### Etapa D — endpoints y autorización

- Lecturas de técnicos, resumen e historial.
- Ranking/alertas.
- Recálculo y cambio de fase restringidos.
- Pruebas de integración y permisos.

### Etapa E — frontend

- Crear cliente API, tipos y hooks.
- Conectar selector/KPIs/estado/fase.
- Mantener estilos actuales.
- Retirar mocks progresivamente.

### Etapa F — validación paralela

- Ejecutar con datos reales sin usar inicialmente las fases para decisiones.
- Comparar contra cálculo manual/Excel.
- Aprobar paridad por Operaciones/Gerencia.
- Activar alertas y Fase 2 después de aprobación.

## 18. Criterios de aceptación del MVP

1. Ningún KPI visible proviene de mocks.
2. Una cuenta ausente de Bitácora cerrada no recibe productividad cero.
3. Una cuenta presente con carga cero sí es evaluable.
4. Sábado y domingo no afectan promedios ni rachas.
5. Desmantelamiento no suma cortes productivos.
6. Fuera de rango suma una sola vez como corte.
7. Cortes productivos nunca es negativa.
8. Metas aplicadas: PXQ 25 y CF 6.
9. Tres días bajo 50% activan Fase 2 una sola vez.
10. Tres días cumpliendo meta activan Alto desempeño.
11. La salida de fase exige Torre de Control y motivo.
12. Toda cifra diaria muestra sus componentes y versión de regla.
13. El recálculo es idempotente.
14. Supervisor no accede a cuentas ajenas.
15. Los casos dorados reales coinciden con la plataforma.

## 19. Decisiones aún abiertas

Estas decisiones no bloquean la creación de tablas de métricas, pero deben cerrarse antes de activar todo el semáforo:

1. Estado PXQ para cortes productivos >= 30 antes de completar la racha de Alto desempeño.
2. Si una ausencia no evaluable suspende o reinicia una racha previa.
3. Disparador y salida exactos de Fase 3.
4. Tratamiento por causa de visita fallida.
5. Flujo detallado de reapertura/cierre de Bitácora.
6. Período histórico disponible para reprocesar desmantelamientos.
7. Fuente formal para distinguir permiso de licencia médica, si se requiere mostrar la causa.

## 20. Próximo paso

Revisar y aprobar este diseño con negocio y el responsable de base de datos. Después de esa aprobación, la primera implementación debe limitarse a:

1. auditoría de datos;
2. migraciones aditivas y reversibles;
3. calculadora pura con pruebas;
4. cálculo de una fecha real en entorno de prueba.

No se recomienda conectar el frontend ni eliminar mocks hasta demostrar paridad con casos reales PXQ y CF.
