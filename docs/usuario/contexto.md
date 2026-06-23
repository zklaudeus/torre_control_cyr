# Contexto general: Módulo de Rendimiento Técnico

## 1. Objetivo del módulo

Crear un módulo dentro de la plataforma para realizar seguimiento diario y acumulado del rendimiento de técnicos o brigadas.

La idea principal es simple:

```text
Identificar al técnico
Medir su productividad diaria
Revisar su evolución acumulada
Detectar técnicos críticos o en recuperación
Apoyar la toma de decisiones del supervisor y Torre de Control
```

Este módulo no nace como un dashboard gerencial, sino como una herramienta operativa para seguimiento diario.

Power BI podrá usar estos datos más adelante para reportes gerenciales, pero la lógica principal debe vivir en la plataforma.

---

## 2. Problema que busca resolver

Actualmente se necesita saber rápidamente:

- Qué técnico trabajó.
- A qué zona pertenece.
- Quién es su supervisor responsable.
- Cuántos cortes realizó en el día.
- Si cumplió o no la meta mínima.
- Si viene bajando o mejorando su rendimiento.
- Si acumula días críticos.
- Si tiene fallidas o frustrados recurrentes.
- Si debe pasar a una fase de seguimiento más estricta.

El objetivo es dejar de mirar solo datos sueltos y comenzar a tener una lectura clara del estado operativo de cada técnico.

---

## 3. Alcance inicial

El módulo debe partir de forma simple y crecer por componentes.

El alcance inicial será:

### 3.1 Identificación del técnico

Mostrar una tarjeta o bloque con:

- Usuario SAP
- Código SAP
- Zona
- Supervisor responsable

Este bloque permite saber inmediatamente a quién se está evaluando.

---

### 3.2 Seguimiento diario

Mostrar el rendimiento del técnico en una fecha operacional específica.

Datos esperados:

- Cortes ejecutados del día
- Meta diaria
- Cumplimiento %
- Fallidas o frustrados del día
- Estado diario del técnico
- Hallazgos o desviaciones detectadas

---

### 3.3 Seguimiento acumulado

Mostrar la evolución del técnico en un rango de fechas.

Datos esperados:

- Total de cortes acumulados
- Productividad promedio
- Mejor productividad registrada
- Días trabajados
- Días bajo meta
- Días críticos
- Días consecutivos bajo 50%
- Total de fallidas
- Variación de fallidas respecto a días anteriores

---

### 3.4 Clasificación del técnico

El sistema debe clasificar automáticamente al técnico en un estado operativo:

- Crítico
- En recuperación
- Estable
- Alto desempeño
- Crítico - Fase 2

Esta clasificación debe permitir saber si el técnico necesita seguimiento, apoyo o revisión.

---

## 4. Meta operacional base

La meta mínima diaria definida para un técnico o brigada es:

```text
25 cortes diarios
```

La productividad principal se calcula en base a cortes.

No se deben sumar visitas fallidas como productividad.

---

## 5. Lectura básica del rendimiento

La plataforma debe interpretar los cortes diarios de esta forma:

```text
0 a 12 cortes      = Crítico
13 a 24 cortes     = En recuperación
25 a 29 cortes     = Estable
30 o más cortes    = Alto desempeño
```

Regla especial:

```text
Si el técnico está bajo el 50% durante 3 días seguidos,
pasa a Crítico - Fase 2.
```

Como la meta diaria es 25 cortes:

```text
50% de 25 = 12.5
```

Para operación se considera bajo 50% cuando el técnico realiza:

```text
12 cortes o menos
```

---

## 6. Indicadores que debe considerar el módulo

### 6.1 Productividad diaria

Cantidad de cortes ejecutados por el técnico en una fecha operacional.

```text
productividad_diaria = cortes_diarios
```

---

### 6.2 Productividad promedio

Promedio de cortes por día trabajado en un rango de fechas.

```text
productividad_promedio = total_cortes_periodo / dias_trabajados
```

---

### 6.3 Mejor productividad

Mayor cantidad de cortes realizada por el técnico en un día dentro del rango seleccionado.

```text
mejor_productividad = máximo(cortes_diarios)
```

Este indicador permite ver el potencial máximo reciente del técnico.

---

### 6.4 Cumplimiento %

Porcentaje de cumplimiento contra la meta diaria de 25 cortes.

```text
cumplimiento_pct = cortes_diarios / 25
```

---

### 6.5 Reducción de frustrados

Comparación de fallidas o frustrados contra el día anterior.

```text
reduccion_frustrados_pct =
(fallidas_dia_anterior - fallidas_hoy) / fallidas_dia_anterior
```

Si el resultado es positivo, el técnico redujo fallidas.

Si el resultado es negativo, el técnico aumentó fallidas.

---

### 6.6 Hallazgos recurrentes

Se deben detectar desviaciones operativas repetidas.

Ejemplos:

- Muchas visitas fallidas.
- Repetición de una misma causa de fallida.
- Mucho fuera de rango.
- Sin avance durante varias horas.
- Último corte muy temprano.
- Baja productividad con alta carga asignada.
- Técnico bajo el 50% varios días seguidos.
- Aumento fuerte de frustrados respecto al día anterior.

---

## 7. Usuarios principales del módulo

### 7.1 Torre de Control

Usará el módulo para:

- Revisar avance diario.
- Detectar técnicos críticos.
- Revisar acumulados.
- Preparar información para reportes.
- Apoyar seguimiento operacional.

---

### 7.2 Supervisor

Usará el módulo para:

- Revisar técnicos bajo su responsabilidad.
- Ver quién está en estado crítico.
- Detectar técnicos en recuperación.
- Revisar hallazgos diarios.
- Tomar acciones correctivas.

---

### 7.3 Gerencia

No necesariamente usará este módulo directamente al inicio.

Gerencia podría ver esta información resumida posteriormente desde Power BI o desde un dashboard ejecutivo.

---

## 8. Estructura sugerida del módulo

El módulo puede dividirse en componentes pequeños.

### Componente 1: Tarjeta Usuario

Objetivo:

```text
Identificar al técnico evaluado.
```

Debe mostrar:

- Usuario SAP + Código
- Zona
- Supervisor responsable

---

### Componente 2: Tarjeta Productividad Diaria

Objetivo:

```text
Mostrar cómo rindió el técnico en el día seleccionado.
```

Debe mostrar:

- Cortes del día
- Meta diaria
- Cumplimiento %
- Estado diario

---

### Componente 3: Tarjeta Acumulado

Objetivo:

```text
Mostrar el rendimiento acumulado del técnico en un rango de fechas.
```

Debe mostrar:

- Total cortes acumulados
- Productividad promedio
- Mejor productividad
- Días trabajados
- Días bajo meta
- Días críticos

---

### Componente 4: Fallidas y Frustrados

Objetivo:

```text
Mostrar comportamiento de fallidas y comparación contra días anteriores.
```

Debe mostrar:

- Fallidas hoy
- Fallidas día anterior
- Variación %
- Reducción o aumento
- Causas principales

---

### Componente 5: Hallazgos Recurrentes

Objetivo:

```text
Mostrar desviaciones operativas detectadas.
```

Debe mostrar:

- Tipo de hallazgo
- Frecuencia
- Fecha
- Nivel de alerta
- Comentario o explicación

---

### Componente 6: Estado Final del Técnico

Objetivo:

```text
Mostrar la clasificación final del técnico.
```

Estados posibles:

- Crítico
- En recuperación
- Estable
- Alto desempeño
- Crítico - Fase 2

---

## 9. Principios de diseño

El módulo debe ser:

- Simple
- Visual
- Operativo
- Fácil de leer
- Enfocado en seguimiento diario
- Preparado para acumulados
- Preparado para Power BI en el futuro

No debe partir como una tabla gigante.

Debe partir con tarjetas claras y componentes reutilizables.

---

## 10. Qué no debe hacer el módulo al inicio

En la primera etapa no se debe:

- Crear lógica demasiado compleja.
- Mezclar todos los indicadores en una sola tabla.
- Crear gráficos avanzados antes de tener los cálculos listos.
- Duplicar lógica que después se usará en backend o SQL.
- Depender de Power BI para clasificar técnicos.
- Agregar funcionalidades de edición si todavía no están definidas.

---

## 11. Fuente de datos esperada

El módulo debería alimentarse desde datos ya existentes en la plataforma o base de datos.

Datos mínimos necesarios:

- fecha_operacional
- usuario
- usuario_sap
- codigo_sap
- zona
- supervisor_responsable
- cortes_diarios
- fallidas
- causa_fallida
- observacion
- tipo_brigada
- estado_brigada

En caso de que algún dato no exista todavía, el componente debe manejar estados de respaldo como:

- Usuario no identificado
- Sin código SAP
- Zona no asignada
- Supervisor no asignado
- Sin información del día

---

## 12. Vista futura recomendada

Más adelante se recomienda crear una vista o endpoint que entregue los datos ya calculados.

Nombre sugerido:

```text
vw_rendimiento_tecnico_diario
```

O endpoint:

```text
/api/rendimiento-tecnico
```

La idea es que el frontend no tenga que calcular toda la lógica pesada.

El frontend debe mostrar la información.

El backend o SQL debe calcular:

- Cortes diarios
- Cumplimiento %
- Productividad promedio
- Mejor productividad
- Días críticos consecutivos
- Estado final
- Fase
- Hallazgos recurrentes

---

## 13. Resultado esperado

Al entrar al módulo, el usuario debería poder ver rápidamente:

```text
Quién es el técnico
A qué zona pertenece
Quién lo supervisa
Cuánto produjo hoy
Cómo viene acumulado
Si está crítico, estable o en alto desempeño
Si tiene hallazgos o fallidas recurrentes
Si debe pasar a Fase 2
```

---

## 14. Enfoque de implementación

Implementar por etapas.

### Etapa 1

Crear estructura base del módulo y Componente 1: Tarjeta Usuario.

### Etapa 2

Agregar tarjeta de productividad diaria.

### Etapa 3

Agregar acumulados.

### Etapa 4

Agregar fallidas/frustrados.

### Etapa 5

Agregar hallazgos recurrentes.

### Etapa 6

Agregar estado final y lógica de Fase 2.

---

## 15. Resumen corto

Este módulo busca convertir datos operativos diarios en una lectura clara del rendimiento técnico.

La prioridad es:

```text
Identificar técnico
Medir cortes diarios
Comparar contra meta de 25
Ver acumulados
Detectar críticos
Detectar recuperación
Detectar alto desempeño
Detectar Fase 2
```

La plataforma será el lugar donde se gestiona el seguimiento.

Power BI podrá consumir estos resultados para reportes gerenciales.
