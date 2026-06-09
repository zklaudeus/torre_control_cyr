# Modelo de Base de Datos - Fase 2

## Tablas creadas

### 1. reportes_cyr
Guarda la cabecera del reporte diario, con `fecha_operacional` única y estado inicial "borrador".

### 2. control_brigadas_diario
Guarda las brigadas reportadas por fecha y zona.

### 3. control_programacion_zona
Guarda los 3 campos manuales por zona y fecha (reconexiones programadas, asignación de carga, corte programado), con una restricción `UNIQUE(fecha_operacional, zona)`.

### 4. control_parametros_zona
Guarda los parámetros (como brigadas por contrato) de cada zona de forma individual. La zona es única.

### 5. control_parametros_generales
Parámetros globales como metas diarias y horas de jornada.

### 6. control_resultados_reales_zona
Tabla que aloja resultados reales diarios para la beta temporal. Contiene los recuentos de reconexiones, cortes (totales, postes, empalmes), visitas fallidas, horarios del primer/último corte y acumulados (09-14), con una restricción `UNIQUE(fecha_operacional, zona)`.

## Índices definidos
- `idx_reportes_cyr_fecha` en `reportes_cyr(fecha_operacional)`
- `idx_brigadas_diario_fecha_zona` en `control_brigadas_diario(fecha_operacional, zona)`
- `idx_programacion_zona_fecha_zona` en `control_programacion_zona(fecha_operacional, zona)`
- `idx_resultados_reales_fecha_zona` en `control_resultados_reales_zona(fecha_operacional, zona)`
