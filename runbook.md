# Runbook Operacional — Torre de Control

## 1. Arranque del Sistema

### Backend
```powershell
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

### Frontend
```powershell
cd frontend
npm run dev
```

### Verificación
- Backend: `GET http://localhost:8000/docs` debe responder Swagger
- Frontend: `http://localhost:5173` debe cargar login
- Login con seed user: `POST /api/auth/login` con usuario precargado

---

## 2. Validación de Datos (Etapa 7)

### 2.1 — Reconciliación CF: Legacy vs Unificado

Compara las dos vías de datos CF (tablas legacy vs tablas unificadas).

```powershell
# Últimos 3 días (default)
python scripts/run_reconciliation_cf.py

# Rango específico
python scripts/run_reconciliation_cf.py --fecha 2026-06-24
python scripts/run_reconciliation_cf.py --ultimos 7 --output resultados.json
```

**Qué verifica:**
1. **Parámetros por zona**: `control_parametros_cf_zona` vs `control_parametros_zona` (CF)
2. **Programación diaria**: `control_programacion_cf_zona` vs `control_programacion_zona` (CF)
3. **Resultados agregados**: ambas vías agregan desde `control_brigadas_diario` con `tipo_brigada='CF'`

**Salida**: JSON con `status: "PASS"` (sin discrepancias) o `"DISCREPANCIAS"`.

### 2.2 — Reporte de Calidad de Datos

Evalúa integridad, completitud y consistencia contra umbrales.

```powershell
# Últimos 30 días con tolerancia 5%
python scripts/run_data_quality_report.py

# Rango específico
python scripts/run_data_quality_report.py --fecha-ini 2026-06-01 --fecha-fin 2026-06-24 --tolerancia 0.05 --output calidad.json
```

**Qué mide:**
| Indicador | Descripción | Umbral default |
|---|---|---|
| Cobertura de días | % de días con datos en el período | >= 95% |
| Completitud | % de filas sin SAP, zona, tipo o usuario | <= 5% |
| Duplicados | Grupos (fecha, SAP) con >1 fila | 0 |
| Huérfanos | Filas sin maestro activo en dim_sap | <= 5% |
| Tipo brigada inválido | Filas con tipo NULL o no PXQ/CF | 0 |
| Zonas activas sin datos | Zonas activas sin brigadas cargadas | 0 |
| Programación dual | Diferencia legacy vs unificado | 0 |

### 2.3 — Validación contra Excel / Power BI

Extraer datos de ambas fuentes y comparar manualmente:

```powershell
# Extraer datos de plataforma para una fecha
python -c "
from sqlalchemy import create_engine
from app.core.config import settings
import csv, sys

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text('''
        SELECT fecha_operacional, zona, tipo_brigada, codigo_sap, usuario,
               reconexiones_ejecutadas, corte_en_poste, corte_en_empalme,
               corte_fuera_de_rango, visita_fallida
        FROM control_brigadas_diario
        WHERE fecha_operacional = '2026-06-24'
        ORDER BY zona, tipo_brigada, codigo_sap
    '''))
    writer = csv.writer(sys.stdout)
    writer.writerow(result.keys())
    writer.writerows(result)
"
```

Redirigir a CSV y comparar contra reporte Excel/PBI de la misma fecha.

### 2.4 — Auditoría de Muestras (procedimiento manual)

1. Seleccionar 3 fechas representativas (lunes, miércoles, viernes)
2. Para cada fecha, seleccionar 2 zonas con actividad PXQ y CF
3. Para cada zona, seleccionar 2 técnicos al azar
4. Verificar manualmente en Excel/PBI: cortes reportados, reconexiones, acumulados
5. Documentar hallazgos en `docs/auditoria_muestras.md`
6. Discrepancia máxima aceptable: **5% por zona por fecha**

---

## 3. Remediación de Discrepancias

### 3.1 — Discrepancia en parámetros de zona

Si `control_parametros_cf_zona` y `control_parametros_zona` difieren:

```sql
-- Ver qué zonas están en legacy pero no en unified
SELECT zona FROM control_parametros_cf_zona
EXCEPT
SELECT zona FROM control_parametros_zona WHERE tipo_brigada = 'CF';

-- Sincronizar: insertar zona faltante en unified
INSERT INTO control_parametros_zona (zona, tipo_brigada, brigadas_contrato, activo)
SELECT c.zona, 'CF', c.brigadas_cf_contrato, c.activo
FROM control_parametros_cf_zona c
WHERE NOT EXISTS (
    SELECT 1 FROM control_parametros_zona z
    WHERE z.zona = c.zona AND z.tipo_brigada = 'CF'
);
```

### 3.2 — Discrepancia en programación diaria

```sql
-- Comparar por fecha y zona
SELECT COALESCE(l.fecha_operacional, u.fecha_operacional) AS fecha,
       COALESCE(l.zona, u.zona) AS zona,
       l.reconexiones_programadas AS legacy_rec,
       u.reconexiones_programadas AS unified_rec,
       l.cortes_programados AS legacy_cortes,
       u.corte_programado AS unified_cortes
FROM control_programacion_cf_zona l
FULL OUTER JOIN (SELECT * FROM control_programacion_zona WHERE tipo_brigada = 'CF') u
  ON u.fecha_operacional = l.fecha_operacional AND u.zona = l.zona
WHERE l.fecha_operacional >= CURRENT_DATE - INTERVAL '7 days'
  AND (l.reconexiones_programadas IS DISTINCT FROM u.reconexiones_programadas
    OR l.cortes_programados IS DISTINCT FROM u.corte_programado)
ORDER BY 1, 2;
```

### 3.3 — Huérfanos en maestro SAP

Ejecutar `scripts/run_stage_a_data_audit.py` para identificar, luego
`scripts/run_remediation_012.py` si aplica (o crear nuevos registros maestro).

---

## 4. Plan de Rollback — Retiro de Tablas/Rutas CF Legacy

### 4.1 — Pre-requisitos para retiro

- [ ] Reconciliación CF: 0 discrepancias por 7 días consecutivos
- [ ] Reporte de calidad: sin alertas > 5% en ningún indicador
- [ ] Auditoría de muestras: brecha <= 5% en todas las muestras
- [ ] Aprobación de Gerencia documentada
- [ ] Backup completo de BD (`scripts/backup_database.py`)

### 4.2 — Procedimiento de retiro

**Fase 1 — Redirección de rutas (día 1):**
1. Agregar migración Alembic que marque tablas legacy como deprecadas
2. Actualizar rutas para que `/api/parametros-cf/` redirija a `/api/configuracion/`
3. Actualizar `/api/programacion-cf-zona/` para leer/escribir sobre `control_programacion_zona`
4. **Verificar frontend**: `frontend/src/components/supervisor/SupervisorBitacoraView.tsx:532` hace `POST /api/programacion-cf-zona/bulk` directamente — cambiar ese llamado para que use el API client unificado (`/api/programacion-zona/bulk`)
5. Eliminar `frontend/src/api/cf.api.ts` y `frontend/src/types/cf.ts` (no referenciados)
6. Ejecutar validación post-cambio con `run_reconciliation_cf.py`

**Fase 2 — Observación (días 2-7):**
- Ejecutar reconciliación cada 24h
- Monitorear errores 404/500 en logs
- Tener rollback listo: restaurar rutas anteriores

**Fase 3 — Eliminación (día 8):**
- Migración Alembic: `DROP TABLE control_parametros_cf_zona, control_programacion_cf_zona`
- Migración Alembic: `DROP TABLE control_parametros_cf_generales` (si no se usa desde unified)
- Eliminar rutas legacy del código
- Eliminar schemas y repositorios CF legacy
- `git rm` archivos legacy de routes, services, repositories, schemas

### 4.3 — Rollback inmediato

Si algo falla después de redirección de rutas:

```powershell
git checkout -- backend/app/api/routes/parametros_cf.py
git checkout -- backend/app/api/routes/programacion_cf_zona.py
git checkout -- backend/app/api/routes/resultados_reales_cf_zona.py
# O revertir commit específico
git revert <hash> --no-edit
```

Si algo falla después de eliminar tablas:

```powershell
# Restaurar desde backup
python scripts/backup_database.py --restore backup_20260625.sql
```

---

## 5. Checklist Diario de Validación

```powershell
# 1. Reconciliación CF (3 días)
python scripts/run_reconciliation_cf.py --ultimos 3

# 2. Calidad de datos (7 días)
python scripts/run_data_quality_report.py --ultimos 7

# 3. Si hay alertas, revisar remediation arriba

# 4. Verificar que backend responde
curl -s http://localhost:8000/api/parametros-cf/ | python -m json.tool | head -20

# 5. Verificar que frontend carga (opcional)
curl -s -o NUL -w "%{http_code}" http://localhost:5173
```

---

## 6. Archivos Relacionados

| Archivo | Propósito |
|---|---|
| `scripts/run_reconciliation_cf.py` | Reconciliación CF legacy vs unificado |
| `scripts/run_data_quality_report.py` | Reporte de calidad de datos |
| `scripts/run_stage_a_data_audit.py` | Auditoría de maestro SAP |
| `scripts/backup_database.py` | Backup/restore de BD |
| `docs/analisis_arquitectura_negocio.md` | Análisis completo y plan de etapas |
| `docs/diseno_tecnico_rendimiento.md` | Diseño técnico del módulo rendimiento |
