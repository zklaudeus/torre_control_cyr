# 06 — Tablas Mínimas (Modelo Conceptual)

Durante esta fase solo se documentan las tablas; no se deben crear sentencias SQL ni migraciones. Estas tablas representan el modelo de datos que se implementará en fases futuras.

## 1. reportes_cyr
Tabla futura para guardar la cabecera del reporte diario.

**Campos conceptuales:**
- id
- fecha_operacional
- estado
- created_at
- updated_at

## 2. control_brigadas_diario
Tabla futura para guardar las brigadas reportadas del día.

**Campos conceptuales:**
- id
- fecha_operacional
- zona
- codigo_sap
- patente
- usuario
- tipo_brigada
- estado_brigada
- hora_primer_movimiento
- observacion_brigada
- created_at
- updated_at

## 3. control_programacion_zona
Tabla futura para guardar los 3 campos manuales por zona.

**Campos conceptuales:**
- id
- fecha_operacional
- zona
- reconexiones_programadas
- asignacion_carga
- corte_programado
- created_at
- updated_at

## 4. control_parametros_zona
Tabla futura para guardar brigadas contrato por zona.

**Campos conceptuales:**
- id
- zona
- brigadas_contrato
- activo
- created_at
- updated_at

## 5. control_parametros_generales
Tabla futura para guardar parámetros CYR generales.

**Campos conceptuales:**
- id
- meta_diaria_cortes_brigada
- hora_inicio_jornada
- hora_cierre_jornada
- activo
- created_at
- updated_at
