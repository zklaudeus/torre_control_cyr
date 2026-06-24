# Diseño del Modelo de Datos: Productividad y Rendimiento Técnico

**Proyecto:** Torre de Control CyR / EISESA  
**Fecha:** 23 de junio de 2026  
**Estado:** Migración aplicada y validada en la base configurada el 24 de junio de 2026

Este documento define el modelo de base de datos requerido para soportar el motor de Productividad y Rendimiento Técnico, **reutilizando las tablas maestras y de carga diaria existentes**. Se han aplicado todas las correcciones estructurales para asegurar trazabilidad, idempotencia, auditoría y optimización.

---

## 1. Tablas Existentes a Reutilizar (Core)

### 1. `control_supervisor_usuarios_sap` (Maestro de Técnicos)
**Propósito:** Fuente de verdad de la identidad del técnico y su asignación a un `supervisor_id`.
- **Columna clave principal:** `codigo_sap` identificará a la unidad productiva de forma unívoca a lo largo del historial y tablas de rendimiento. (No se crea tabla nueva de técnicos).

### 2. `control_brigadas_diario` (Datos Diarios en Terreno)
**Propósito:** Contiene la producción diaria reportada.
- **Uso en Rendimiento:** De aquí el motor extrae datos crudos por `fecha_operacional` y `codigo_sap`.

### 3. `control_parametros_generales` y `control_parametros_cf_generales`
**Propósito:** Contienen las metas diarias a aplicar (25 para PXQ, 6 para CF).

---

## 2. Nuevas Tablas a Crear (Módulo de Rendimiento)

Todos los ID principales nuevos usarán `BIGSERIAL` y sus referencias internas usarán `BIGINT`. Las referencias hacia tablas legacy usan `INTEGER`, en concordancia con sus PK `SERIAL`. Las fechas/hora usan `TIMESTAMPTZ` con defecto `now()`.

### 1. `bitacoras_supervisor_diarias`
**Propósito:** Cabecera explícita por supervisor para confirmar cuándo el día ha sido cerrado oficialmente por Torre de Control, permitiendo justificar ausencias y congelar datos.
- `id` BIGSERIAL PK
- `fecha_operacional` DATE NOT NULL
- `supervisor_id` INTEGER NOT NULL (FK a control_supervisores)
- `estado` VARCHAR NOT NULL DEFAULT 'ABIERTA' -> 'ABIERTA', 'CERRADA_TC'
- `fecha_apertura` TIMESTAMPTZ NOT NULL DEFAULT now()
- `fecha_cierre` TIMESTAMPTZ NULL
- `cerrada_por_id` INTEGER NULL (FK a control_usuarios)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
**Restricción Única:** UNIQUE(`fecha_operacional`, `supervisor_id`)

### 2. `rendimiento_tecnico_diario`
**Propósito:** Persistir la evaluación productiva inmutable como un "snapshot", incorporando los componentes auditables del cálculo diario para evitar cálculos al vuelo.
- `id` BIGSERIAL PK
- `fecha_operacional` DATE NOT NULL
- `codigo_sap` VARCHAR NOT NULL
- **Snapshot del Día:**
  - `usuario` VARCHAR NOT NULL
  - `supervisor_id` INTEGER NULL (FK a control_supervisores)
  - `zona` VARCHAR NULL
  - `tipo_brigada` VARCHAR NULL
- **Componentes Auditables (desde Crudos):**
  - `corte_en_poste` INTEGER NOT NULL DEFAULT 0
  - `corte_en_empalme` INTEGER NOT NULL DEFAULT 0
  - `corte_fuera_de_rango` INTEGER NOT NULL DEFAULT 0
  - `visita_fallida` INTEGER NOT NULL DEFAULT 0
  - `reconexiones` INTEGER NOT NULL DEFAULT 0
- **Evaluación (Cálculo):**
  - `cortes_productivos` INTEGER NOT NULL DEFAULT 0 -> (`corte_en_poste` + `corte_en_empalme` + `corte_fuera_de_rango`)
  - `meta_aplicada` INTEGER NOT NULL
  - `cumplimiento_pct` NUMERIC(7,2) NOT NULL
  - `es_evaluable` BOOLEAN NOT NULL DEFAULT TRUE
  - `estado_diario` VARCHAR NULL -> Puede ser NULL si `es_evaluable` es false. Valores: 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO'.
  - `motivo_no_evaluable` VARCHAR NULL
  - `ausencia_id` BIGINT NULL (FK a rendimiento_tecnico_ausencias)
  - `bitacora_id` BIGINT NULL (FK a bitacoras_supervisor_diarias; obligatorio cuando `es_evaluable` es true)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
**Restricción Única:** UNIQUE(`fecha_operacional`, `codigo_sap`)
**Índices Recomendados:**
- Index(`fecha_operacional`, `codigo_sap`)
- Index(`codigo_sap`, `fecha_operacional`)
- Index(`supervisor_id`, `fecha_operacional`)
- Index(`zona`, `fecha_operacional`)

### 3. `rendimiento_tecnico_actual`
**Propósito:** "Foto" rápida de las rachas y fase actual por técnico.
- `codigo_sap` VARCHAR PK
- `fase_actual` INTEGER NOT NULL DEFAULT 1
- `estado_productivo_actual` VARCHAR NOT NULL DEFAULT 'SIN_EVALUACION'
- `dias_consecutivos_bajo_50` INTEGER NOT NULL DEFAULT 0
- `dias_consecutivos_alto_desempeno` INTEGER NOT NULL DEFAULT 0
- `advertencias_fase2` INTEGER NOT NULL DEFAULT 0
- `fecha_ultima_evaluacion` DATE NULL -> NULL si el técnico aún no es evaluado
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 4. `rendimiento_tecnico_historial`
**Propósito:** Trazabilidad flexible de cualquier salto de fase o cambio de estado de rachas, permitiendo atributos nulos cuando no correspondan al tipo de evento.
- `id` BIGSERIAL PK
- `codigo_sap` VARCHAR NOT NULL
- `fecha_cambio` TIMESTAMPTZ NOT NULL DEFAULT now()
- `tipo_cambio` VARCHAR NOT NULL -> 'FASE', 'ESTADO_ACTUAL', 'OVERRIDE_MANUAL', 'ADVERTENCIA', 'RECALCULO'
- `fase_anterior` INTEGER NULL
- `fase_nueva` INTEGER NULL
- `estado_anterior` VARCHAR NULL
- `estado_nuevo` VARCHAR NULL
- `motivo` TEXT NULL
- `usuario_id` INTEGER NULL (FK a control_usuarios) -> Puede ser NULL si es un proceso del sistema; es obligatorio para `OVERRIDE_MANUAL`
- `regla_disparadora` VARCHAR NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
**Índices Recomendados:**
- Index(`codigo_sap`, `fecha_cambio`)

### 5. `rendimiento_tecnico_advertencias`
**Propósito:** Registrar y gestionar advertencias formales que gatillarán el paso a Fase 3.
- `id` BIGSERIAL PK
- `codigo_sap` VARCHAR NOT NULL
- `fecha_operacional` DATE NOT NULL
- `fase_al_momento` INTEGER NOT NULL DEFAULT 2
- `numero_advertencia` INTEGER NULL -> Contador relativo a la racha
- `motivo` TEXT NOT NULL
- `estado` VARCHAR NOT NULL DEFAULT 'ACTIVA' -> 'ACTIVA', 'ANULADA'
- `registrada_por_id` INTEGER NOT NULL (FK a control_usuarios)
- `fecha_registro` TIMESTAMPTZ NOT NULL DEFAULT now()
- `anulada_por_id` INTEGER NULL (FK a control_usuarios)
- `fecha_anulacion` TIMESTAMPTZ NULL
- `motivo_anulacion` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
**Regla:** Solo las advertencias 'ACTIVA' en `fase_al_momento` 2 cuentan para el salto a Fase 3.
**Índices Recomendados:**
- Index(`codigo_sap`, `estado`, `fase_al_momento`)

### 6. `rendimiento_tecnico_ausencias`
**Propósito:** Justificaciones que congelan las rachas de productividad y hacen el día "no evaluable".
- `id` BIGSERIAL PK
- `codigo_sap` VARCHAR NOT NULL
- `fecha_operacional` DATE NOT NULL
- `causa` VARCHAR NOT NULL -> 'PERMISO', 'LICENCIA', 'VACACIONES', 'MAESTRO', 'NO_REPORTADO', 'OTRO'
- `registrada_por_id` INTEGER NOT NULL (FK a control_usuarios)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
**Restricción Única:** UNIQUE(`codigo_sap`, `fecha_operacional`)
**Índices Recomendados:**
- Index(`codigo_sap`, `fecha_operacional`)

### 7. `rendimiento_tecnico_causas_fallidas`
**Propósito:** Detalle granular de las causas de fallidas, sin ensuciar la métrica productiva, pero fundamental para auditoría gerencial.
- `id` BIGSERIAL PK
- `fecha_operacional` DATE NOT NULL
- `codigo_sap` VARCHAR NOT NULL
- `rendimiento_diario_id` BIGINT NULL (FK a rendimiento_tecnico_diario) -> Permite agrupar o conectar la carga al snapshot.
- `causa_fallida` VARCHAR NOT NULL
- `cantidad` INTEGER NOT NULL CHECK (`cantidad > 0`)
- `observacion` TEXT NULL
- `origen` VARCHAR NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
**Restricción Única:** UNIQUE(`fecha_operacional`, `codigo_sap`, `causa_fallida`)
**Índices Recomendados:**
- Index(`codigo_sap`, `fecha_operacional`)
- Index(`causa_fallida`)
- Index(`rendimiento_diario_id`)

---

## 3. Reglas Funcionales y de Consistencia

### Regla de Consistencia de Fallidas
La suma del campo `cantidad` en `rendimiento_tecnico_causas_fallidas` debe coincidir exactamente con el valor del campo `visita_fallida` en la tabla `rendimiento_tecnico_diario` para el mismo `codigo_sap` y `fecha_operacional`. Esta validación **NO debe hacerse con un CHECK en base de datos** porque cruza información entre dos tablas distintas. Debe quedar implementada a nivel de código en el servicio backend encargado del cálculo y validación diaria.

### Regla Funcional de Análisis
Las causas de visitas fallidas no afectan la productividad ni las rachas. Sin embargo, deben poder consultarse desde la pantalla de Rendimiento Técnico para mostrar a los supervisores y a Torre de Control el siguiente desglose:
- Causa específica.
- Cantidad absoluta.
- Porcentaje sobre el total de fallidas del día.
- Acumulado de fallidas por causa en los últimos 7 días.
- Acumulado de fallidas por causa en los últimos 14 días.
- Acumulado de fallidas por causa en el mes calendario.

### Checks de Consistencia Importantes
La migración debe incluir las siguientes restricciones a nivel de base de datos:
- CHECK cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango
- CHECK estado_productivo_actual IN ('SIN_EVALUACION', 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO')
- CHECK tipo_cambio IN ('FASE', 'ESTADO_ACTUAL', 'OVERRIDE_MANUAL', 'ADVERTENCIA', 'RECALCULO')
- CHECK meta_aplicada > 0
- CHECK de coherencia entre `es_evaluable`, `estado_diario`, `motivo_no_evaluable`, `ausencia_id` y `bitacora_id`
- CHECK `tipo_brigada` en PXQ/CF cuando no sea NULL
- CHECK de estados anterior/nuevo del historial
- CHECK que `OVERRIDE_MANUAL` tenga `usuario_id`

### Integridad con el esquema existente
La migración declara FKs para supervisores y actores de auditoría. También agrega un índice único parcial sobre `control_supervisor_usuarios_sap(codigo_sap)` cuando `activo=true`, evitando asignaciones activas ambiguas. No se usa `codigo_sap` como FK directa porque el maestro legacy no posee una restricción única global compatible con todas sus filas históricas.

Las FKs internas son compuestas cuando existe información duplicada en el snapshot: una ausencia debe coincidir en ID, SAP y fecha; una Bitácora debe coincidir en ID y supervisor; y el detalle de fallidas debe coincidir en ID de rendimiento, SAP y fecha. Esto impide enlaces cruzados válidos por ID pero incorrectos para el día evaluado.

La aplicación de la migración exige comprobar que `control_supervisores`, `control_supervisor_usuarios_sap` y `control_usuarios` existan. En particular, `control_usuarios` aún no aparece en la cadena SQL 001–011 y debe confirmarse en el catálogo real antes de aprobar el despliegue. La consulta de solo lectura está preparada en `backend/sql/preflight/012_rendimiento_tecnico.sql`.

### Atomicidad y reversa
`012_rendimiento_tecnico.sql` se ejecuta dentro de una transacción explícita. La reversa controlada está en `backend/sql/rollback/012_rendimiento_tecnico.sql`; ninguno de los dos archivos debe ejecutarse contra una base real sin aprobación DBA.

---

## 4. Próximo Paso Aprobado
La revisión DBA, la remediación del maestro SAP, la migración y el postflight fueron completados. El siguiente paso es implementar la calculadora y los servicios backend con pruebas de las reglas funcionales; las tablas no deben poblarse desde producción hasta validar esos servicios con casos dorados.
