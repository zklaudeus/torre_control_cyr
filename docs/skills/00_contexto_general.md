# Skill: Contexto General - Torre Control CyR

## Objetivo

Proporcionar una visión general completa del sistema Torre Control CyR, su propósito, arquitectura, y módulos actuales. Este skill sirve como punto de partida para entender el proyecto antes de trabajar en cualquier área específica.

## Archivos relacionados

- `docs/database/diagrama_base_datos.md` - Diagrama ER completo
- `backend/app/models/cyr_models.py` - Modelos SQLAlchemy
- `frontend/src/pages/DashboardPage.tsx` - Página principal del dashboard
- `frontend/src/components/dashboard/SidebarNav.tsx` - Navegación principal
- `frontend/src/auth/supervisoresTemp.ts` - Datos de usuarios de prueba

## Flujo de datos general

### Arquitectura general

```
Frontend (React + TypeScript) → API (FastAPI) → Base de datos (PostgreSQL)

Frontend:
├── Login (supervisor/admin)
├── Dashboard principal con sidebar
├── Módulos principales:
│   ├── Torre Control CyR (Inicio del día, Brigadas, Programación, KPIs)
│   ├── Bitácora Supervisor CyR
│   ├── Reporte Gerencial CyR
│   ├── Configuración
│   └── ... (otros módulos)
└── API calls a endpoints REST

API (FastAPI):
├── Autenticación y autorización
├── Endpoints CRUD para todas las entidades
├── Lógica de negocio y validaciones
├── Cálculos de KPIs y consolidación de datos
└── Integración con base de datos

Base de datos (PostgreSQL):
├── Tablas principales (7 tablas base + CF específicas)
├── Sin foreign keys físicas - todo lógico
├── Datos por `fecha_operacional` y `zona`
└── Soporta brigadas PXQ y CF
```

### Ciclo operativo diario

1. **Inicio del día (Torre Control)**
   - Supervisor crea día operativo en `reportes_cyr` (estado: 'borrador')
   - Sistema lee parámetros de zona (`control_parametros_zona`)
   - Se proyecta esfuerzo esperado del día

2. **Brigadas del día (Bitácora Supervisor)**
   - Datos de asistencia y asignación ingresan a `control_brigadas_diario`
   - Sistema cruza usuario con `dim_tipo_brigada_usuario` para etiquetar PXQ vs CF
   - Validaciones: patente, SAP, cuenta, brigada, comuna

3. **Programación diaria (Torre Control)**
   - Coordinador registra carga y metas en `control_programacion_zona`
   - Para PXQ (y posiblemente CF mixto) o en `control_programacion_cf_zona` para CF

4. **Reporte gerencial (Reporte Gerencial)**
   - Resultados acumulados por horas y visitas efectivas
   - Actualizados en `control_brigadas_diario`
   - Totales de zona calculados/guardados en `control_resultados_reales_zona`
   - Cerrar día en `reportes_cyr`

## Módulos actuales

### ✅ Funcionales (desarrollados)

1. **Torre Control CyR**
   - Inicio del día
   - Resumen General
   - Resumen por Zona
   - Reporte Gerencial
   - Configuración

2. **Bitácora Supervisor CyR** (nuevo)
   - Ingreso de brigadas
   - Validaciones completas
   - Sincronización con Torre Control

3. **Medición** (planificado)
   - Placeholder actual

4. **Empalme** (planificado)
   - Placeholder actual

### ⏳ Próximos

- Medición - registro de mediciones
- Empalme - control de empalmes
- Módulos CF - gestión separada de Corte Fijo

## Estado actual

### ✅ Completado
- Autenticación de usuarios (supervisor/admin)
- Navegación entre módulos
- Gestión de brigadas diarias
- Programación PXQ
- Cálculo de KPIs
- Sincronización en tiempo real

### 🔄 En desarrollo
- Módulo Bitácora Supervisor
- Reporte Gerencial avanzado
- Validaciones mejoradas

### 📋 Documentación
- Diagrama ER completo
- Modelo de datos
- Especificaciones de API
- Guías de usuario
- Documentación técnica

## Reglas importantes

1. **Sin FKs físicos** - Todas las relaciones son lógicas (por strings)
2. **Doble estándar** - Tablas PXQ y CF en paralelo
3. **Datos por día** - Todo almacenado por `fecha_operacional`
4. **Zonas geográficas** - Iquique, Coquimbo, Santa Cruz, Talca, Concepción, Los Ángeles, Chillán
5. **Dos tipos de brigadas** - PXQ (Pago por Cantidad) y CF (Corte Fijo)

## Cómo usar este skill

### Para desarrolladores
- Entender la arquitectura general del sistema
- Comprender el flujo de datos entre frontend y backend
- Identificar dónde encaja su trabajo
- Evitar trabajar en áreas no asignadas

### Para stakeholders
- Entender qué funcionalidades existen
- Saber qué está completo vs en desarrollo
- Planificar nuevas características
- Evaluar el estado actual del proyecto

### Para nuevos equipos
- Punto de partida para onboarding
- Documentación de referencia rápida
- Guía para mantener consistencia

## Checklist rápido

✅ Arquitectura clara definida
✅ Flujo de datos documentado
✅ Módulos actuales identificados
✅ Estado actual especificado
✅ Reglas importantes destacadas
✅ Guías de uso proporcionadas

## Próximos pasos sugeridos

1. Leer skill específico según tarea
2. Revisar archivos relacionados
3. Entender dependencias
4. Planificar cambios
5. Seguir reglas de modificación

Este skill proporciona la base conceptual necesaria para trabajar en cualquier área del proyecto Torre Control CyR.