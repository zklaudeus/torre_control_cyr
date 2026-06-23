# Diseño del Modelo de Datos: Productividad y Rendimiento Técnico

**Proyecto:** Torre de Control CyR / EISESA  
**Fecha:** 23 de junio de 2026  
**Estado:** Modelo Final Aprobado para Migración

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

Todos los ID principales usarán `BIGSERIAL` (PK) e identificadores foráneos `BIGINT`. Las fechas/hora usarán `TIMESTAMPTZ` con defecto `now()`.

### 1. `bitacoras_supervisor_diarias`
**Propósito:** Cabecera explícita por supervisor para confirmar cuándo el día ha sido cerrado oficialmente por Torre de Control, permitiendo justificar ausencias y congelar datos.
- `id` BIGSERIAL PK
- `fecha_operacional` DATE NOT NULL
- `supervisor_id` BIGINT NOT NULL (FK a control_usuarios)
- `estado` VARCHAR NOT NULL DEFAULT 'ABIERTA' -> 'ABIERTA', 'CERRADA_TC'
- `fecha_apertura` TIMESTAMPTZ NOT NULL DEFAULT now()
- `fecha_cierre` TIMESTAMPTZ NULL
- `cerrada_por_id` BIGINT NULL (FK a control_usuarios)
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
  - `supervisor_id` BIGINT NULL
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
  - `cumplimiento_pct` NUMERIC(5,2) NOT NULL
  - `es_evaluable` BOOLEAN NOT NULL DEFAULT TRUE
  - `estado_diario` VARCHAR NULL -> Puede ser NULL si `es_evaluable` es false. Valores: 'CRITICO', 'RECUPERACION', 'ESTABLE', 'ALTO_DESEMPENO'.
  - `motivo_no_evaluable` VARCHAR NULL
  - `ausencia_id` BIGINT NULL (FK a rendimiento_tecnico_ausencias)
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
- `estado_productivo_actual` VARCHAR NOT NULL
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
- `tipo_cambio` VARCHAR NOT NULL -> 'FASE', 'ESTADO_ACTUAL', 'OVERRIDE_MANUAL'
- `fase_anterior` INTEGER NULL
- `fase_nueva` INTEGER NULL
- `estado_anterior` VARCHAR NULL
- `estado_nuevo` VARCHAR NULL
- `motivo` TEXT NULL
- `usuario_id` BIGINT NULL (FK a control_usuarios) -> Puede ser NULL si es un proceso del sistema
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
- `registrada_por_id` BIGINT NOT NULL (FK a control_usuarios)
- `fecha_registro` TIMESTAMPTZ NOT NULL DEFAULT now()
- `anulada_por_id` BIGINT NULL
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
- `registrada_por_id` BIGINT NOT NULL (FK a control_usuarios)
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
- `cantidad` INTEGER NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
**Restricción Única:** UNIQUE(`fecha_operacional`, `codigo_sap`, `causa_fallida`)
**Índices Recomendados:**
- Index(`codigo_sap`, `fecha_operacional`)

---

## 3. Próximo Paso Aprobado
Con el diseño validado, se procederá a:
1. Crear los modelos de **SQLAlchemy**.
2. Crear los archivos de **Migración** (`Alembic` o `.sql`).
3. (No se deben crear ni ejecutar los modelos en código hasta que el entorno lo solicite explícitamente en el siguiente paso de implementación).
