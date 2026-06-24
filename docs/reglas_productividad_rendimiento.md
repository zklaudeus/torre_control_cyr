# Reglas de productividad y rendimiento técnico — Fase 0

**Proyecto:** Torre de Control CyR / EISESA  
**Fecha:** 23 de junio de 2026  
**Estado:** reglas funcionales aprobadas para implementación
**Alcance:** fuente funcional del módulo de Productividad y Rendimiento Técnico.

## 1. Resumen ejecutivo

El módulo de Productividad y Rendimiento Técnico debe permitir conocer de manera confiable cómo trabaja cada técnico y cada brigada, detectar tempranamente bajo rendimiento y orientar capacitaciones o acciones de mejora. Para que esa evaluación sea justa y útil, no basta con contar actividades: debe existir una meta aplicable, días comparables, una identidad estable de brigada y reglas auditables de cambio de estado/fase.

La recomendación principal de este documento es:

> Usar los **cortes productivos** como indicador principal: corte en poste, corte en empalme y corte fuera de rango, con mínimo cero. Las reconexiones y actividades totales permanecen como indicadores complementarios.

La unidad productiva es la misma para PXQ y CF: cortes productivos. Las reconexiones no forman parte del numerador de cumplimiento. Las visitas fallidas NO se descuentan de la productividad, y solo se usarán para análisis y seguimiento.

El proyecto actual ya calcula cortes, reconexiones, fallidas y agregados por fecha y código SAP. La decisión de negocio reemplaza la meta PXQ de 30 por 25, conserva CF en 6 y establece un calendario evaluable de lunes a viernes. El sistema aún no implementa esta lógica ni posee fases persistidas. Por ello, las reglas de este documento se separan en:

- **Confirmado en el proyecto:** comportamiento observable en código/modelos actuales; no implica aprobación gerencial.
- **Propuesto:** recomendación para la vertical nueva.
- **Pendiente de confirmación:** decisión que debe aprobar el negocio antes de programar.

## 2. Reglas confirmadas en el proyecto actual

### 2.1 Productividad y operación

| Regla | Estado | Evidencia actual |
|---|---|---|
| Los resultados de Excel se consolidan por `fecha_operacional + codigo_sap`. | Confirmado en código | `backend/app/cleaning_engine/calculator.py`. |
| Total de cortes considera corte en poste, corte en empalme, desmantelamiento y corte fuera de rango. | Confirmado en código | Categorías de `rules.py`. |
| Reconexiones se contabilizan separadamente. | Confirmado en código | `reconexiones_ejecutadas`. |
| Actividades totales se calculan como cortes + reconexiones. | Confirmado en código | `ResumenZonaService` y reporte gerencial. |
| Visitas fallidas se contabilizan separadamente y no suman a `total_cortes`. | Confirmado en código | Motor de clasificación y servicios. |
| La medida “fuera de rango” con foto válida cuenta actualmente como corte; sin foto se clasifica como fallida. | Confirmado en código | `classifier.py`. |
| `corte_fuera_de_rango` figura además dentro de las categorías de reconexión. | Confirmado en código, inconsistente | Puede contar la misma actividad como corte y reconexión. Debe resolverse antes de implementar productividad. |
| Un reporte operacional debe corresponder a una sola fecha y la fecha del Excel debe coincidir con la seleccionada. | Confirmado en código | `cleaning_engine/service.py`. |

### 2.2 Metas y tipos de brigada

| Regla | Estado | Observación |
|---|---|---|
| El sistema reconoce tipos `PXQ` y `CF`. | Confirmado en código y BD | Existen checks parciales y filtros por tipo. |
| La configuración general usa 30 cortes diarios como default PXQ. | Confirmado técnicamente | No equivale a una regla de negocio aprobada; contradice la base de 25 solicitada. |
| La configuración CF usa 6 cortes diarios como default. | Confirmado técnicamente y confirmado por negocio | Se mantiene en la nueva regla. |
| PXQ y CF ya pueden tener metas diferentes. | Confirmado técnicamente | Hay estructuras separadas, aunque la persistencia de configuración está incompleta. |

**Decisión de negocio confirmada:** la meta PXQ debe cambiar de 30 a 25. Este documento no realiza el cambio técnico.

### 2.3 Brigada diaria

El registro actual `control_brigadas_diario` contiene:

- fecha operacional;
- zona;
- código SAP;
- patente;
- usuario/nombre;
- tipo PXQ/CF;
- estado operativa/inactiva;
- observación;
- cortes y reconexiones programadas;
- resultados ejecutados y acumulados horarios.

También se confirma que:

- una brigada inactiva debe tener observación, según validación del servicio;
- el frontend impide repetir una cuenta SAP para el mismo tipo en el día;
- existe un campo textual `pareja` en el maestro SAP, pero no una composición diaria normalizada con dos técnicos;
- no existe una clave única de BD que impida duplicar fecha + SAP;
- no existe historial formal de cambio de patente, zona o supervisor durante el día.

### 2.4 Días evaluables y fases

- No existe actualmente en código un calendario operacional que limite la evaluación a lunes–viernes.
- No existe una entidad de ausencia, licencia, contingencia o justificación de día no evaluable.
- No existen tablas ni reglas backend persistidas para estados de rendimiento o fases 1–3.
- Los estados, fases, hallazgos y recomendaciones visibles en el módulo actual son mocks del frontend.

**Decisión de negocio confirmada:** la lista diaria de brigadas ingresada por el supervisor en Bitácora será la fuente de verdad de operatividad. Si la cuenta SAP aparece en la lista, el día debe evaluarse; si no aparece, se considera no operativa por permiso o licencia médica y el día no se evalúa.

## 3. Reglas confirmadas por negocio y reglas propuestas

### 3.1 Reglas cerradas por negocio

1. La productividad principal son los **cortes productivos**.
2. `Cortes productivos = corte en poste + corte en empalme + corte fuera de rango`.
3. Las visitas fallidas se contabilizan solo para análisis y no descuentan productividad ni afectan estados, fases o rachas.
4. Desmantelamiento no contabiliza como corte productivo.
5. La meta PXQ es 25 cortes diarios y reemplaza el valor técnico actual de 30.
6. La meta CF se mantiene en 6 cortes diarios.
7. PXQ y CF usan la misma unidad productiva: cortes productivos.
8. La unidad evaluada se identifica únicamente por la cuenta usuario SAP.
9. Las parejas no se contabilizan ni dividen la productividad.
10. Los días operativos/evaluables pertenecen al rango lunes–viernes.
11. Un día es evaluable cuando la cuenta SAP aparece en la lista diaria de brigadas de la Bitácora del Supervisor; no existe carga mínima.
12. Sábados y domingos no se evalúan.
13. Los cambios de patente no generan una nueva brigada si se mantiene la cuenta SAP.
14. Los cambios de carga quedan asociados a la misma cuenta SAP y fecha operacional.
15. Alto desempeño requiere cumplir o superar la meta durante 3 días evaluables consecutivos.
16. Tres días evaluables consecutivos bajo 50% activan Fase 2.
17. Toda salida de fase requiere aprobación de Torre de Control.
18. Una ausencia es un día no evaluable y no rompe, no suspende ni reinicia la racha.
19. Los 3 días requeridos para Alto desempeño deben ser evaluables y consecutivos.
20. Para PXQ, En recuperación corresponde a 13–24 cortes productivos y Estable a 25–29 cortes productivos.
21. Para CF, En recuperación corresponde a 3–5 cortes productivos y Estable a 6 o más hasta completar la racha de Alto desempeño.
22. Fase 3 se activa cuando un técnico en Fase 2 acumula tres advertencias activas registradas por Torre de Control.

### 3.2 Reglas de diseño propuestas

1. Las reconexiones se muestran separadas y participan en `actividades_totales`, pero no en el cumplimiento de productividad.
2. Corte fuera de rango debe dejar de figurar también como reconexión, evitando doble conteo.
3. El sistema debe distinguir una bitácora abierta/incompleta de una bitácora cerrada, para que una cuenta ausente solo se considere no operativa después del cierre diario.
4. Los promedios y rachas incluyen exclusivamente cuentas SAP presentes en Bitácora durante días evaluables lunes–viernes.
5. La clave de la evaluación diaria debe ser `cuenta_sap + fecha_operacional`; la patente es un atributo mutable.
6. Estado de rendimiento y fase de seguimiento son conceptos distintos.
7. Toda evaluación debe conservar meta aplicada, componentes de cortes productivos, fallidas, porcentaje y regla utilizada.

## 4. Reglas pendientes de confirmación

### 4.1 Decisiones bloqueantes

| ID | Decisión pendiente | Motivo |
|---|---|---|
| PC-02 | Criterio de salida de Fase 3. | Solo está confirmado que Torre de Control debe aprobarla. |
| PC-04 | Flujo formal de aprobación de salida de fases. | Falta definir roles, estados, motivo, evidencia y rechazo. |
| PC-05 | Historial/bitácora de aprobación. | Debe definirse el nivel de detalle y retención requerido. |
| PC-06 | Estado PXQ con 30 o más cortes antes de completar la racha de Alto desempeño. | El rango Estable termina en 29 y Alto desempeño exige 3 días consecutivos. |
| PC-07 | Datos incompletos y corrección. | Falta responsable, plazo y efecto sobre rachas. |
| PC-08 | Cambios de zona o supervisor durante el día. | Solo están confirmados cambios de patente y carga. |

### 4.2 Estado adicional recomendado

**Pendiente de confirmación:** agregar `Sin datos suficientes` o `No evaluable` además de Crítico, En recuperación, Estable y Alto desempeño. Sin este estado, una cuenta SAP nueva o con datos incompletos podría quedar clasificada injustamente.

## 5. Fórmulas recomendadas

### 5.1 Variables

Para un técnico/brigada en un día `d`:

- `CP_d`: cortes en poste válidos.
- `CE_d`: cortes en empalme válidos.
- `CFR_d`: cortes fuera de rango.
- `R_d`: reconexiones válidas, excluyendo corte fuera de rango.
- `VF_d`: visitas fallidas.
- `M_d`: meta de cortes aplicable según tipo, zona y vigencia.
- `LB_d`: indicador de que la cuenta SAP figura en la lista de brigadas de la Bitácora cerrada.
- `E_d`: indicador de día evaluable (`1` si es lunes–viernes y `LB_d=1`; `0` en otro caso).

### 5.2 Fórmulas principales

```text
Cortes productivos del día = CP_d + CE_d + CFR_d

Cumplimiento diario (%) =
  (Cortes productivos del día / Meta aplicable del día) × 100

Actividades totales = Cortes productivos del día + Reconexiones válidas del día

Productividad acumulada del período =
  suma de cortes productivos en días evaluables

Productividad promedio =
  suma de cortes productivos / cantidad de días evaluables

Mejor productividad =
  máximo de cortes productivos entre los días evaluables del período
```

### 5.3 Fórmula principal recomendada

```text
Productividad diaria principal = cortes productivos
```

**Decisión confirmada:** las metas se expresan en cortes productivos. Las fallidas no se descuentan y se conservan exclusivamente para análisis. Las reconexiones no forman parte del cumplimiento; `Actividades totales` continúa como KPI complementario.

### 5.4 Agregación por técnico, zona y tipo

```text
Productividad por técnico =
  suma de cortes productivos de la cuenta SAP en días evaluables

Cumplimiento acumulado del técnico (%) =
  suma de cortes productivos / suma de metas aplicables × 100

Productividad total de zona =
  suma de cortes productivos de cuentas SAP de la zona

Productividad promedio de zona =
  suma de cortes productivos / total de cuentas-jornada evaluables

Cumplimiento de zona (%) =
  suma de cortes productivos / suma de metas aplicables × 100

Productividad por tipo de brigada =
  suma de cortes productivos de jornadas evaluables del tipo PXQ o CF

Cumplimiento por tipo (%) =
  suma de cortes productivos del tipo / suma de metas aplicables del tipo × 100
```

No se recomienda promediar porcentajes diarios sin ponderación cuando las metas varían. Para acumulados, debe usarse `suma resultado / suma meta`.

### 5.5 Visitas fallidas

```text
Cortes productivos = corte en poste + corte en empalme + corte fuera de rango

Cumplimiento productividad (%) =
  cortes productivos / meta diaria × 100
```

Reglas confirmadas:

Las visitas fallidas **NO deben usarse para**:
- Categoría productiva o estado productivo.
- Racha bajo 50% o racha de cumplimiento.
- Activación o cambio de fase.

Las visitas fallidas **solo deben usarse para**:
- Total del día por usuario SAP.
- Variación porcentual vs día anterior.
- Acumulados (7 días, 14 días, mensual).
- Análisis por causa de fallida.
- Hallazgos y recomendaciones para supervisor y gerencia.

### 5.5.1 Variación de fallidas

```text
fallidas_variacion_abs = fallidas_hoy - fallidas_dia_anterior

fallidas_variacion_pct = 
  si fallidas_dia_anterior > 0:
    ((fallidas_hoy - fallidas_dia_anterior) / fallidas_dia_anterior) * 100
  si fallidas_dia_anterior = 0:
    usar null o advertencia "sin base comparativa"
```
Interpretación:
- **Positivo**: aumentaron fallidas.
- **Negativo**: disminuyeron fallidas.
- **Cero**: sin variación.

### 5.5.2 Tratamiento de causa fallida

La causa de fallida debe visualizarse en pantalla para que gerencia y supervisores puedan analizar en reunión:
- Causas más frecuentes por técnico y por zona.
- Evolución de fallidas por período.
- Acciones para reducir casos repetidos.

### 5.6 Períodos

- **Diario:** una fecha operacional.
- **Semanal:** días evaluables de lunes a viernes.
- **Promedio móvil propuesto:** últimos 5 días evaluables.
- **Acumulado mensual:** desde el primer día operacional del mes hasta la fecha seleccionada.
- **Comparación:** siempre mostrar rango, cantidad de días evaluables y meta aplicada.

## 6. Criterios PXQ

### 6.1 Decisión confirmada

- **Meta diaria PXQ:** 25 cortes productivos.
- **Cambio requerido posteriormente:** reemplazar el valor técnico actual de 30 por 25.
- **Crítico:** cumplimiento de cortes productivos bajo 50%.
- **En recuperación:** 13–24 cortes de cortes productivos.
- **Estable:** 25–29 cortes de cortes productivos.
- **Alto desempeño:** cumplir o superar la meta durante 3 días evaluables consecutivos.

### 6.2 Criterios PXQ

```text
PXQ:
- Meta diaria: 25 de cortes productivos.
- Crítico diario: cortes productivos entre 0 y 12.
- En recuperación: cortes productivos entre 13 y 24.
- Estable: cortes productivos entre 25 y 29.
- Alto desempeño: cortes productivos >= 25 durante 3 días evaluables consecutivos.
```

| Nivel diario | Porcentaje | Cortes con meta 25 | Estado de aprobación |
|---|---:|---:|---|
| Crítico | `< 50%` | 0–12 | Confirmado |
| En recuperación | Desde 52% hasta 96% | 13–24 | Confirmado |
| Estable | Desde 100% hasta 116% | 25–29 | Confirmado |
| Alto desempeño | Meta cumplida durante 3 días evaluables consecutivos | 25 o más en cada uno de los 3 días | Confirmado |

La meta 25 sustituye a 30 para PXQ. El cambio técnico se realizará en una etapa posterior, fuera de esta Fase 0. Falta definir el estado temporal de una cuenta con 30 o más cortes antes de completar los 3 días consecutivos requeridos para Alto desempeño.

## 7. Criterios CF

### 7.1 Decisión confirmada

- **Meta diaria CF:** 6 cortes productivos.
- **Unidad productiva:** la misma que PXQ.
- **Crítico:** cumplimiento de cortes productivos bajo 50%.
- **En recuperación:** 3–5 cortes de cortes productivos.
- **Estable:** 6 o más cortes mientras no complete la racha de Alto desempeño.
- **Alto desempeño:** cumplir o superar la meta durante 3 días evaluables consecutivos.

### 7.2 Criterios CF

```text
CF:
- Meta diaria: 6 de cortes productivos.
- Crítico diario: cortes productivos entre 0 y 2.
- En recuperación: cortes productivos entre 3 y 5.
- Estable: cortes productivos >= 6 hasta completar la racha.
- Alto desempeño: cortes productivos >= 6 durante 3 días evaluables consecutivos.
```

| Nivel diario | Porcentaje | Cortes con meta 6 | Estado de aprobación |
|---|---:|---:|---|
| Crítico | `< 50%` | 0–2 | Confirmado como umbral grave |
| En recuperación | Desde 50% hasta menos de 100% | 3–5 | Confirmado |
| Estable | `>= 100%`, sin racha completa | 6 o más | Confirmado |
| Alto desempeño | Meta cumplida durante 3 días evaluables consecutivos | 6 o más en cada uno de los 3 días | Confirmado |

La meta CF de 6, la unidad productiva y los rangos de estado quedan confirmados.

## 8. Definición de brigada

### 8.1 Definición confirmada

Para este módulo, la **cuenta usuario SAP** es la unidad productiva evaluada y representa a la brigada. No se contabilizan parejas ni se divide la productividad entre integrantes.

```text
Identificador lógico de brigada = cuenta usuario SAP

Identificador único de evaluación diaria = cuenta SAP + fecha operacional
```

La implementación puede mantener un ID técnico interno, pero la identidad de negocio es la cuenta SAP. La patente no forma parte de la identidad y puede cambiar sin crear otra brigada.

### 8.2 Campos mínimos obligatorios

| Campo | Regla |
|---|---|
| `id_evaluacion_diaria` | ID técnico generado, si el diseño de BD lo requiere. |
| `fecha_operacional` | Obligatoria. |
| `cuenta_sap` | Obligatoria; identifica la unidad productiva. |
| `zona_id` | Obligatoria. |
| `supervisor_id` | Obligatorio según asignación vigente. |
| `tipo_brigada_id` | PXQ o CF. |
| `estado_operativo` | Se deriva de la presencia en la lista: toda cuenta incluida se considera operativa. |
| `meta_aplicable` | 25 PXQ o 6 CF, registrada para reproducibilidad. |
| `presencia_en_bitacora` | Se materializa por la existencia de la cuenta SAP en la lista diaria; determina operatividad/evaluabilidad. |
| `carga_asignada` | Valor asignado por el supervisor; no tiene mínimo y puede cambiar durante el día. |

### 8.3 Campos condicionales u opcionales

- patente/vehículo;
- brigada/código interno habitual;
- reconexiones programadas;
- cortes programados;
- hora de inicio/cierre;
- observación;
- evidencia o contingencia;
- comuna inicial.

Las cuentas no operativas no aparecen en la lista diaria. Si en el futuro se requiere distinguir permiso de licencia médica, deberá existir una fuente separada de ausencias; no se deduce la causa específica solo desde la ausencia.

### 8.4 Composición

```text
Unidad evaluada = cuenta usuario SAP.
Parejas = no se contabilizan.
División por integrantes = no aplica.
Producción = se atribuye íntegramente a la cuenta SAP evaluada.
```

### 8.5 Cambios durante el día

```text
Reglas de cambio de patente =
  permitido para la misma cuenta SAP;
  no genera una nueva brigada.

Reglas de cambio de carga =
  permitido para la misma cuenta SAP y fecha operacional;
  debe conservarse el valor vigente usado para evaluar.

Reglas de cambio de zona =
  pendiente de confirmación.

Reglas de supervisor responsable =
  pendiente de confirmación para cambios durante el día.
```

Los cambios de patente y carga están confirmados. Los cambios de zona o supervisor siguen pendientes.

## 9. Definición de día evaluable

### 9.1 Regla principal confirmada

```text
Día evaluable =
  la fecha está entre lunes y viernes,
  la cuenta SAP aparece en la lista diaria de brigadas
  de la Bitácora del Supervisor,
  la meta PXQ/CF está definida,
  y los datos mínimos de ejecución fueron validados.
```

No existe una carga mínima. La presencia de la cuenta SAP en la lista diaria determina que estuvo operativa y debe evaluarse, incluso si la carga registrada es cero. La ausencia de la cuenta indica que ese día no estuvo operativa por permiso o licencia médica y no debe penalizarse.

### 9.2 Tratamiento por caso

| Caso | Regla | Resultado |
|---|---|---|
| Lunes a viernes con cuenta SAP incluida en Bitácora | Evaluable. | Calcula productividad y racha, sin carga mínima. |
| Sábado | No evaluable. | Se excluye aunque existan datos. |
| Domingo | No evaluable. | Se excluye aunque existan datos. |
| Feriado de lunes a viernes | Evaluable si la cuenta aparece en Bitácora, mientras no se defina una excepción de calendario. | Regla derivada del rango confirmado. |
| Lunes a viernes con cuenta SAP ausente de Bitácora cerrada | No evaluable; no operativa por permiso o licencia médica. | No castiga a la cuenta SAP. |
| Datos incompletos | Pendiente de validación. | No recalcular estado/fase hasta corregir o cerrar como no evaluable. |
| Cuenta incluida, con carga cero y cero ejecución | Evaluable con cortes productivos 0 y cumplimiento 0%. | Sí afecta la racha porque la presencia en Bitácora confirma operatividad. |

### 9.3 Formato resumido solicitado

```text
Día evaluable = lunes a viernes + cuenta SAP presente en Bitácora + meta + datos válidos.

Día no evaluable = sábado, domingo o cuenta SAP ausente
de la Bitácora diaria cerrada.

Día con carga y cero ejecución = evaluable con cortes productivos 0 y 0%.

Día con cuenta presente y carga cero = evaluable; no existe carga mínima.

Día con cuenta ausente = no operativo/no evaluable por permiso o licencia médica.

Día con datos incompletos = pendiente de validación;
no cambia estado ni fase hasta resolución.
```

### 9.4 Consecutividad

“Tres días seguidos” significa **tres días evaluables consecutivos de la cuenta SAP**. Sábado y domingo no cuentan como días, y tampoco generan por sí solos bajo rendimiento.

### 9.5 Salvaguarda de cierre de Bitácora

Una ausencia:
- Es día no evaluable.
- No suma productividad cero.
- **No rompe, no suspende ni reinicia la racha.** La racha se calcula solo sobre días evaluables.

Causas manuales de ausencia que se deben soportar:
- Permiso
- Licencia médica
- Vacaciones
- Ausencia de maestro
- No reportado
- Otra causa

**Flujo de Bitácora:**
- **Apertura de bitácora:** La realiza el supervisor cuando comienza a asignar usuarios SAP, cargas, zonas y carga en bandeja.
- **Cierre de bitácora:** Lo realiza **Torre de Control**.
- La ausencia o presencia solo se considera definitiva después del cierre de Torre de Control. Mientras esté abierta, el sistema no evalúa ausencias.

## 10. Criterios de estados y fases

### 10.1 Diferencia conceptual

- **Estado de rendimiento:** lectura calculada del desempeño reciente: Crítico, En recuperación, Estable o Alto desempeño.
- **Fase de seguimiento:** nivel de intervención organizacional: Fase 1, 2 o 3.

Un técnico puede estar en Fase 2 y mostrar estado En recuperación. No debe bajar automáticamente de fase por un solo día bueno.

### 10.2 Estados confirmados y pendientes

```text
Crítico =
  último día evaluable con cortes productivos bajo 50% de la meta,
  o racha grave activa,
  o hallazgo operacional crítico que invalide alto desempeño.

En recuperación =
  PXQ: cortes productivos entre 13 y 24 cortes.
  CF: cortes productivos entre 3 y 5 cortes.

Estable =
  PXQ: cortes productivos entre 25 y 29 cortes,
  siempre que todavía no se haya completado la racha de Alto desempeño.
  CF: cortes productivos de 6 o más cortes,
  mientras todavía no se haya completado la racha de Alto desempeño.

Alto desempeño =
  cumple o supera la meta de cortes productivos
  durante 3 días evaluables consecutivos.
```

La regla de Alto desempeño, su consecutividad y los rangos PXQ/CF están confirmados. PXQ conserva exactamente los rangos 13–24 y 25–29 definidos por negocio.

### 10.3 Fases propuestas

```text
Fase 1 =
  seguimiento normal/preventivo;
  estado inicial de todo técnico con datos suficientes;
  incluye técnicos estables o de alto desempeño y alertas aisladas.

Fase 2 =
  seguimiento reforzado;
  se activa al completar 3 días evaluables consecutivos
  con cortes productivos bajo 50%;
  requiere motivo, responsable, fecha de inicio y plan de acción/capacitación.

Fase 3 =
  se activa al registrar la tercera advertencia en Fase 2;
  las advertencias las registra Torre de Control;
  NO se activa automáticamente por fallidas.
```

### 10.4 Transiciones

```text
Regla de subida de fase =
  Fase 1 -> Fase 2: 3 días evaluables consecutivos < 50%.

  Fase 2 -> Fase 3: al registrar la tercera advertencia por Torre de Control en Fase 2. La salida requiere acción/aprobación de Torre de Control.

Regla de recuperación =
  estado Crítico -> En recuperación:
  PXQ alcanza entre 13 y 24 cortes productivos;
  CF alcanza entre 3 y 5 cortes productivos.

  En recuperación -> Estable:
  PXQ alcanza entre 25 y 29 cortes productivos
  sin haber completado todavía la racha de Alto desempeño;
  CF alcanza 6 o más cortes productivos
  sin haber completado todavía la racha de Alto desempeño.

  Fase 2 -> Fase 1:
  criterio objetivo pendiente + aprobación de Torre de Control.

  Fase 3 -> Fase 2 o Fase 1:
  criterio pendiente + aprobación de Torre de Control.

Regla de reincidencia =
  pendiente de definición.
```

### 10.5 Salvaguardas

- No cambiar fase con días no evaluables o datos incompletos.
- No recalcular silenciosamente fases históricas cuando cambie una meta/regla.
- Guardar estado anterior/nuevo, regla disparadora, datos usados, autor y fecha.
- Ninguna salida de fase debe automatizarse completamente: requiere aprobación de Torre de Control.
- Permitir override manual solo a roles autorizados y con motivo obligatorio.
- Un hallazgo de seguridad/calidad puede impedir Alto desempeño, pero la lista exacta está pendiente.
- Capacitación debe registrarse como acción de mejora, no como castigo automático.

## 11. Riesgos si se implementa sin confirmar estas reglas

| Severidad | Riesgo | Consecuencia |
|---|---|---|
| Crítico | Implementar meta 25 mientras reportes siguen usando 30. | Un mismo técnico obtiene cumplimientos distintos según pantalla. |
| Crítico | Duplicar fuera de rango como corte y reconexión. | Actividad/productividad inflada y ranking incorrecto. |
| Crítico | Evaluar antes de que el supervisor cierre la Bitácora. | Cuentas aún no cargadas se interpretarían erróneamente como permiso/licencia. |
| Alto | Usar carga mayor que cero como requisito de evaluación. | Una cuenta presente y operativa con carga cero quedaría excluida contra la regla confirmada. |
| Alto | Seguir contabilizando desmantelamiento como corte productivo. | Productividad incompatible con la regla confirmada. |
| Alto | Mezclar cortes y reconexiones contra una meta de cortes. | Cumplimiento aparente sin alcanzar el objetivo contractual. |
| Alto | No versionar metas y reglas. | La historia cambia al recalcular y deja de ser auditable. |
| Alto | Cambiar fase automáticamente con datos incompletos. | Acciones de capacitación o intervención basadas en información errónea. |
| Alto | Usar la patente como identidad en lugar de cuenta SAP. | Un cambio de vehículo crea brigadas falsas o corta el historial. |
| Medio | Alto desempeño por un solo día. | Ranking volátil y poca utilidad gerencial. |
| Medio | Confundir estado con fase. | Un técnico en recuperación podría cerrar seguimiento demasiado pronto. |
| Medio | Contar sábados o domingos. | Rachas y promedios incompatibles con el calendario confirmado. |
| Medio | Automatizar salidas de fase. | Se omite la aprobación obligatoria de Torre de Control. |

## 12. Recomendación final antes de programar

La Fase 0 queda suficientemente cerrada para diseñar el modelo mínimo de datos y los casos de prueba, utilizando como reglas confirmadas:

- cortes productivos = `poste + empalme + fuera de rango`;
- desmantelamiento no contabiliza;
- meta PXQ 25 y meta CF 6;
- cuenta SAP como unidad productiva, sin parejas;
- lunes–viernes con cuenta SAP presente en la lista diaria de Bitácora como días evaluables;
- sin carga mínima;
- cuenta SAP ausente de la Bitácora cerrada = no operativa/no evaluable por permiso o licencia médica;
- cambios de patente y carga permitidos sin crear otra brigada;
- alto desempeño tras 3 días evaluables consecutivos alcanzando la meta;
- Fase 2 por 3 días evaluables consecutivos bajo 50%;
- salida de fases con aprobación de Torre de Control.

Antes de automatizar completamente los estados y fases deben cerrarse los pendientes restantes: salida de Fase 3, flujo/bitácora de aprobación y tratamiento de datos incompletos. PXQ conserva sus rangos aprobados sin introducir un rango provisional adicional.

Con la revisión DBA y la migración completadas, el siguiente paso es implementar la calculadora y el servicio backend. La matriz de pruebas debe cubrir al menos PXQ/CF, cuenta presente con carga cero, cuenta ausente, Bitácora abierta/cerrada, fallidas mayores a cortes, cambio de patente, cambio de carga, tres días bajo 50%, tres días cumpliendo meta y tercera advertencia activa en Fase 2.
