# Migración de Lógica de Frontend a Backend: Análisis y Plan de Acción

## 1. Diagnóstico y Mapa General de Arquitectura Actual

El sistema Torre Control CyR opera actualmente bajo un modelo de "Thick Client" (Cliente Pesado) en el que el frontend asume una gran responsabilidad de lógica de negocio, validaciones y cálculos matemáticos.

### 1.1 Estado Actual
- **Frontend (React)**: 
  - Organizado por áreas de negocio (`inicio-dia`, `supervisor`, `resumen-general`, etc.).
  - Alta dependencia de Custom Hooks (`useProgramacionDiaria`, etc.) y archivos utilitarios (`SupervisorBitacoraLogic.ts`, `compararBrigadasIniciales.ts`) para cruzar datos y aplicar reglas de negocio.
  - Filtra información sensible del lado del cliente (ej: `getAllUsuariosSap` trae todos los registros de la empresa y luego el frontend filtra según las zonas del supervisor logueado).
- **Backend (FastAPI)**:
  - Estructurado en capas clásicas (`routes`, `services`, `repositories`, `models`).
  - Actúa en muchos casos como un mero sistema CRUD (Create, Read, Update, Delete), entregando datos "crudos" para que el frontend los procese.
  - Contiene un `cleaning_engine` que sugiere que parte del procesamiento de archivos ya se hace en backend, pero hay desconexiones.

### 1.2 Acoplamiento
Existe un alto acoplamiento en el frontend respecto a la estructura de la base de datos. Por ejemplo, la resolución de zonas a partir de comunas o la asociación de un trabajador a un supervisor depende de mapeos locales en React. Esto genera fragilidad ante datos nulos o inconsistentes en la BD.

---

## 2. Tabla de Hallazgos: Lógica a Migrar (Priorizada)

| Prioridad | Módulo / Función | Ubicación Actual | Justificación |
| :--- | :--- | :--- | :--- |
| **Alta** | **Filtros por Supervisor/Rol** | `SupervisorBitacoraView.tsx` | Seguridad y rendimiento. El frontend no debe descargar todo el padrón SAP para filtrarlo localmente. |
| **Alta** | **Validaciones de Bitácora** | `SupervisorBitacoraLogic.ts` | Reglas de negocio críticas (cuentas duplicadas, cruce SAP/Zona). Si se hace una API pública o carga masiva, se saltarían las validaciones. |
| **Alta** | **Cálculo de Resumen por Zona** | `SupervisorBitacoraLogic.ts` / `ResumenGeneralPanel` | Matemáticas de negocio (Corte Programado, Reconexiones) deben ser la "única fuente de verdad" y vivir en backend. |
| **Media** | **Copiado del Día Anterior** | `useCrearDesdeDiaAnterior.ts` | Manejar transacciones masivas (clonar brigadas de ayer a hoy) desde el cliente es propenso a fallos de red. |
| **Media** | **Reporte Gerencial (KPIs)** | `ReporteGerencialDashboardView.tsx` | Las fórmulas de cumplimiento y agregaciones complejas sobrecargan el navegador. |
| **Baja** | **Normalización de strings** | `SupervisorBitacoraLogic.ts` | Reglas de limpieza de texto (`normalizeStr`) deberían ocurrir antes de guardar en BD. |

---

## 3. Lógica que DEBE quedarse en el Frontend

Para mantener una experiencia de usuario rápida y fluida, las siguientes responsabilidades se mantendrán en React:

- **Manejo del estado visual y UI temporal**: Estados como `tempRow`, `editId`, o modales abiertos.
- **Validaciones de formulario básicas (UX)**: Evitar campos vacíos, formatos de patente incorrectos, antes de enviar la petición (para ahorrar llamadas a la API).
- **Filtros y ordenamiento visual**: Ej. Buscar una brigada por nombre en una tabla ya cargada.
- **Confirmaciones y Alertas**: Prompts de "Estás seguro que deseas guardar", notificaciones de éxito/error.

---

## 4. Endpoints Sugeridos

Para concretar la migración, se sugiere crear/actualizar los siguientes endpoints:

1. `GET /api/supervisores/me/usuarios-sap`
   - **Reemplaza**: `getAllUsuariosSap()` + Filtrado local por zona.
   - **Respuesta**: Solo la lista de trabajadores SAP permitidos para el supervisor autenticado según el JWT.

2. `GET /api/supervisores/me/bitacora/resumen`
   - **Reemplaza**: `calcularResumenPorZona(rows, comunasMap)`.
   - **Request**: `?fecha=YYYY-MM-DD`
   - **Respuesta**: Agrupación matemática pre-calculada por zona.

3. `POST /api/brigadas-dia/copiar-dia-anterior`
   - **Reemplaza**: `prepararBrigadasDesdeDiaAnterior.ts` y las múltiples llamadas POST desde el front.
   - **Request**: `{ "fecha_origen": "2026-06-17", "fecha_destino": "2026-06-18" }`
   - **Respuesta**: Estado de la transacción y resumen de brigadas copiadas.

4. `GET /api/reportes/gerencial/kpis`
   - **Reemplaza**: Cálculos masivos iterativos en `useReporteGerencial.ts`.
   - **Respuesta**: JSON con el cumplimiento, promedios y eficiencias ya procesados matemáticamente.

---

## 5. Análisis de Riesgos

- **Riesgo de romper la Bitácora Supervisor**: Al mover la validación al backend, la UI podría percibir latencia si validamos letra por letra. **Mitigación**: Aplicar validación diferida (al perder el foco `onBlur` o al hacer click en "Guardar").
- **Inconsistencia de KPIs durante la migración**: Riesgo de que la Fase 3 calcule números distintos a los que acostumbra ver gerencia. **Mitigación**: Correr en paralelo y validar resultados antes de apagar el cálculo del front.
- **Exposición de datos cruzados**: Riesgo de que un error en el nuevo endpoint `/me/usuarios-sap` mezcle zonas. **Mitigación**: Pruebas unitarias estrictas en los Repositories filtrando siempre por `supervisor_id` del token JWT.

---

## 6. Plan de Migración por Fases

Se ejecutará una migración progresiva e iterativa:

- **Fase 1**: Análisis y documentación (Estado Actual - *Completado con este informe*).
- **Fase 2**: Mover validaciones simples y filtros por supervisor/rol al backend (ej. Nuevo endpoint de usuarios SAP).
- **Fase 3**: Mover cálculos matemáticos de resumen y KPIs (Bitácora y Reporte Gerencial).
- **Fase 4**: Centralizar permisos de usuarios y roles estrictos mediante Middlewares en FastAPI.
- **Fase 5**: Refactorizar la carga asistida Excel (`ProcesadorOperacional`) para que el backend asuma el peso del cruce de datos.
- **Fase 6**: Limpieza de código muerto en frontend, consolidando su rol como capa de visualización pura.

---

## 7. Recomendación de Arquitectura Final Ideal

**Estructura Backend Ideal (FastAPI)**
```text
backend/app/
├── api/routes/          # Controladores (Solo reciben Request y retornan Response)
├── schemas/             # Pydantic models para validación de I/O
├── models/              # SQLAlchemy Entities
├── services/            # LÓGICA DE NEGOCIO Y MATEMÁTICAS (Nueva casa de los cálculos)
├── repositories/        # Consultas a BD (Queries crudas o via ORM)
├── utils/validators/    # Validaciones complejas y cruces de SAP
└── cleaning_engine/     # Procesador de Excels y pipelines masivos
```

**Estructura Frontend Ideal (React)**
```text
frontend/src/
├── app/                 # Configuración global, providers, router
├── auth/                # Manejo de JWT (sin lógica de permisos complejos, solo roles)
├── modules/             # Componentes agrupados por dominio de negocio (ej: supervisor)
├── shared/              # UI genérica (botones, tablas, inputs)
└── services/api/        # Clientes axios generados u organizados
```

---

## 8. Siguiente Paso Recomendado

1. Revisar este documento y aprobar el alcance y prioridades.
2. Una vez aprobado, realizar un **backup de la base de datos**.
3. Crear una nueva rama en el repositorio (ej: `feat/migracion-fase2`).
4. Iniciar oficialmente la **Fase 2** implementando el endpoint seguro para obtener los trabajadores de SAP por supervisor.
