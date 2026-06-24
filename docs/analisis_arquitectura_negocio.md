# Análisis de arquitectura y negocio — Torre de Control CyR / EISESA

**Fecha del análisis:** 23 de junio de 2026  
**Alcance:** diagnóstico del sistema legacy y decisiones arquitectónicas del módulo; la migración 012 fue aplicada y validada en la base configurada el 24 de junio de 2026.
**Fuente del diagnóstico:** código y documentación presentes en el árbol de trabajo actual, incluidos cambios locales no confirmados del módulo de rendimiento técnico.  

## 1. Resumen ejecutivo

El proyecto ya contiene una base funcional valiosa: frontend React/TypeScript, API FastAPI, persistencia PostgreSQL mediante SQLAlchemy, un flujo de bitácora diaria, programación por zona, carga de resultados desde Excel, reportes y una separación parcial en rutas, servicios y repositorios. No se recomienda reescribirlo. La estrategia adecuada es estabilizar el modelo de datos y extraer progresivamente las reglas críticas hacia el backend.

El sistema aún no tiene una única fuente de verdad. Conviven:

- reglas en servicios backend;
- cálculos adicionales o correctivos en React;
- parámetros recuperados desde base de datos junto con valores por defecto hardcodeados;
- tablas generales con `tipo_brigada` y tablas específicas de CF en paralelo;
- maestros SAP, zonas y permisos en SQL, scripts Python y archivos TypeScript;
- autenticación backend con un fallback local que permite cuentas y un acceso administrador de prueba.

El frontend de **Rendimiento Técnico** continúa siendo un prototipo visual: técnicos, KPIs, semáforos, fases, cursos, hallazgos y recomendaciones provienen de `frontend/src/data/rendimientoTecnico.mock.ts`. Las siete tablas del módulo ya existen y fueron validadas, pero todavía no existen servicios ni endpoints productivos. Por tanto, ningún estado o fase mostrado en la UI debe considerarse dato real.

Las mayores brechas son:

1. autenticación y autorización temporal o incompleta;
2. definiciones contradictorias de meta y cumplimiento;
3. identidad SAP legacy sin unicidad global histórica; el módulo reutiliza `control_supervisor_usuarios_sap` y no crea otro maestro de personal;
4. falta de claves foráneas y trazabilidad histórica consistente;
5. lógica y permisos de negocio todavía presentes en el frontend;
6. migraciones manuales sin un mecanismo formal de versionado;
7. falta de pruebas automatizadas de las fórmulas operacionales.

La meta aprobada para el módulo es **25 cortes productivos para PXQ** y **6 para CF**. El valor legacy de 30 no debe alimentar los snapshots nuevos. La siguiente fase no debe conectar pantallas: primero corresponde validar la migración contra el catálogo PostgreSQL real y construir el dominio backend con pruebas.

## 2. Estado actual del proyecto

### 2.1 Carpetas principales

| Carpeta | Responsabilidad actual | Diagnóstico |
|---|---|---|
| `backend/` | API FastAPI, modelos SQLAlchemy, schemas Pydantic, servicios, repositorios, motor de limpieza Excel, SQL y scripts administrativos. | Tiene una separación inicial por capas, pero mezcla migraciones SQL manuales, scripts de corrección y modelos en un único archivo. |
| `backend/app/api/routes/` | Exposición de endpoints HTTP. | Las rutas son delgadas en varios módulos, pero la política de autorización no es uniforme. Hay lecturas operacionales públicas y escrituras que solo bloquean a `gerencia`. |
| `backend/app/services/` | Orquestación y cálculos de programación, resumen, resultados, CF, reportes y autenticación. | Es el lugar correcto para reglas, pero existen fórmulas duplicadas y nombres de métricas no equivalentes. |
| `backend/app/repositories/` | Acceso a SQLAlchemy y persistencia. | Correcto como intención. Algunos repositorios no se usan y varios métodos hacen `commit` por ítem, dificultando operaciones atómicas. |
| `backend/app/models/` | Entidades SQLAlchemy. | Las 14 tablas están en `cyr_models.py`; faltan FKs en el ORM y dominios importantes están modelados como texto libre. |
| `backend/app/schemas/` | Contratos de entrada y salida Pydantic. | Hay validaciones parciales. Los ejecutados y acumulados aceptan negativos; las actualizaciones parciales de brigada chocan con validaciones obligatorias del servicio. |
| `backend/app/cleaning_engine/` | Lectura, normalización, clasificación, deduplicación y carga de Excel SAP. | Buena separación interna, pero las reglas y mapeos están hardcodeados, no se persiste el detalle de eventos importados y no existe auditoría de lote. |
| `backend/sql/` | Creación y alteración manual del esquema, semillas y correcciones de datos. | Funciona como historial informal. No hay tabla de versión ni Alembic; contiene maestros operacionales que cambian con el tiempo. |
| `backend/scripts/` | Migraciones y semillas Python ejecutables manualmente. | Se solapa con `backend/sql/` y `Base.metadata.create_all`, generando tres mecanismos de evolución del esquema. |
| `frontend/` | SPA React 19 + TypeScript + Vite. | Organizada parcialmente por pantallas/dominios, pero algunos componentes concentran UI, llamadas HTTP, permisos, validaciones y cálculos. |
| `frontend/src/api/` | Cliente Axios y funciones de acceso a endpoints. | Es una base adecuada; falta un módulo API de productividad/rendimiento y una política común de errores/autenticación. |
| `frontend/src/hooks/` | Carga, estado y orquestación de datos. | Contiene cálculos de agregación que deberían ser solo presentación o venir calculados del backend. |
| `frontend/src/components/` | Vistas y componentes por dominio. | `SupervisorBitacoraView.tsx` tiene 1.089 líneas y responsabilidades excesivas. El módulo de rendimiento consume mocks directamente. |
| `frontend/src/utils/` | Cálculos y preparación de datos. | Parte es utilidad de presentación, pero el copiado del día anterior y los totales de brigada son reglas de negocio/transacciones. |
| `frontend/src/auth/` | Contexto de sesión y usuarios temporales. | Mantiene permisos y credenciales de prueba en el cliente; no debe ser una fuente de autorización. |
| `frontend/src/data/` | Datos mock del módulo de rendimiento. | Prototipo explícito; todo su contenido operacional debe salir de API/BD antes de uso real. |
| `database/` | Documentación del esquema. | El diagrama ayuda, pero contradice parcialmente los SQL: declara ausencia total de FKs, mientras `002_supervisores_bd.sql` sí crea FKs si fue aplicado. |
| `docs/` | Contexto funcional, estructura, análisis previos y documentación de usuario. | Contiene información útil, aunque algunos documentos describen estados anteriores y deben indicar versión/fecha. |

### 2.2 Archivos importantes

| Archivo | Función actual | Observación |
|---|---|---|
| `backend/app/main.py` | Registra middleware CORS y routers. | Todos los routers quedan bajo `/api`; no existe versionado `/api/v1`. |
| `backend/app/models/cyr_models.py` | Define todas las entidades. | Archivo monolítico y sin relaciones ORM/FKs declaradas. |
| `backend/app/services/resumen_zona_service.py` | Calcula totales y cumplimiento por zona/tipo. | Es una fuente principal de fórmulas actuales. Usa cortes para una métrica y cuenta todas las brigadas reportadas como denominador. |
| `backend/app/services/reporte_gerencial_cyr_service.py` | Calcula reporte gerencial. | Define `cumplimiento_meta` usando actividades, no solo cortes; difiere del resumen por zona. |
| `backend/app/cleaning_engine/rules.py` | Clasificación SAP, zonas y alias. | Contiene reglas de negocio críticas y maestros hardcodeados. |
| `backend/app/cleaning_engine/calculator.py` | Calcula resultados por fecha y SAP. | Agrupa a nivel técnico, pero solo actualiza el consolidado diario; no conserva el detalle fuente. |
| `backend/app/repositories/configuracion_repository.py` | Devuelve/guarda configuración. | Gran parte de lo mostrado es un default hardcodeado y `save_configuracion` solo persiste activación y dotación de zonas. |
| `frontend/src/App.tsx` | Router y fecha operacional global. | `/reporte-gerencial` está fuera de `ProtectedRoute`. |
| `frontend/src/components/supervisor/SupervisorBitacoraView.tsx` | Flujo completo de bitácora. | Mezcla red, permisos, normalización, validación, persistencia, agregación y UI. |
| `frontend/src/components/supervisor/SupervisorBitacoraLogic.ts` | Validaciones y resumen local. | Duplica reglas que también existen en `supervisor_bitacora_service.py`. |
| `frontend/src/pages/ReporteGerencialPage.tsx` | Reporte gerencial activo. | Recalcula porcentajes sobre datos ya calculados por backend y dispara una carga duplicada. |
| `frontend/src/data/rendimientoTecnico.mock.ts` | Mock completo de rendimiento. | No debe llegar a producción como fuente de datos. |
| `frontend/src/auth/supervisoresTemp.ts` | Usuarios, zonas y permisos temporales. | Contiene credenciales legibles y reglas de acceso CF en el cliente. |

### 2.3 Dependencias principales

**Frontend**

- React 19 y React DOM.
- React Router DOM 7, usando `HashRouter`.
- Axios para API.
- Recharts para visualización gerencial.
- Vite 8, TypeScript 6 y ESLint 10 para desarrollo.

**Backend declaradas**

- FastAPI y Uvicorn.
- SQLAlchemy y `psycopg2-binary` para PostgreSQL.
- Pydantic y `pydantic-settings`.
- `python-dotenv` y `python-multipart`.

**Dependencias usadas pero no declaradas en `requirements.txt`**

- `pandas` (motor de limpieza).
- un motor para Excel, previsiblemente `openpyxl` para `.xlsx` y `xlrd` si se mantendrá `.xls`.
- `PyJWT` (importado como `jwt`).
- `bcrypt`.

Esto impide reproducir de forma confiable el entorno solo con `requirements.txt`.

### 2.4 Archivos duplicados, legacy, temporales o sospechosos

| Archivo o grupo | Clasificación | Evidencia / recomendación futura |
|---|---|---|
| `frontend/src/components/supervisor/script.py` a `script7.py` | Temporal, alta confianza | Son scripts de reemplazo de texto con ruta absoluta local que modifican `SupervisorBitacoraView.tsx`. Mover fuera de `src` o eliminar tras validar historial. |
| `backend/test_db.py` a `test_db7.py` | Diagnóstico manual | Imprimen datos reales; no contienen aserciones ni son pruebas automatizadas. Migrar comprobaciones útiles a tests y retirar los scripts. |
| `backend/fix_db.py`, `backend/fix_db2.py` | Corrección ad hoc | Modifican mapeos usando nombres y rutas absolutas. Conservar solo como evidencia hasta reemplazarlos por migración auditable. |
| `backend/alter.py` | Legacy y riesgo de seguridad | Contiene URL PostgreSQL y contraseña hardcodeada, además de DDL manual. Prioridad crítica para retirar el secreto del historial y reemplazar el mecanismo. |
| `backend/check.py` | Diagnóstico manual | Consulta restricciones; puede transformarse en una verificación de migración o documentación. |
| `backend/app/cleaning_engine/test_run.py` | Prueba manual | No pertenece al paquete productivo y no usa framework de tests. |
| `frontend/src/pages/ReporteGerencialPage.tsx` y `frontend/src/components/reporte-gerencial/ReporteGerencialDashboardView.tsx` | Implementaciones duplicadas | Comparten gran parte de la UI y fórmulas. La página es la ruta activa; la vista solo está referenciada desde `CyrDashboardView.tsx`. Consolidar después de pruebas. |
| `frontend/src/components/cyr/CyrDashboardView.tsx` | Posiblemente sin uso | No tiene consumidor encontrado en `src`; confirmar antes de retirar. |
| `backend/app/repositories/resultado_real_zona_repository.py` y tabla `control_resultados_reales_zona` | Posible camino abandonado | El endpoint actual calcula desde `control_brigadas_diario`; no se encontró uso del repositorio de consolidado. Decidir entre vista/materialización o eliminación futura. |
| Tablas y rutas `*_cf_*` junto con tablas generales con `tipo_brigada` | Duplicación transicional | Mantienen dos fuentes de programación/configuración CF. Elegir un modelo canónico y migrar de forma controlada. |
| `frontend/src/assets/react.svg`, `vite.svg` | Residuo de plantilla probable | No se encontraron referencias. Confirmar con build/import graph antes de retirar. |
| `backend/README.md`, `frontend/README.md` | Documentación desactualizada | Aún describen “Fase 1” y omiten arquitectura, configuración, migraciones y pruebas. |

No se encontraron archivos JSON de negocio; los JSON existentes corresponden al ecosistema npm. El problema no es JSON operacional, sino constantes TypeScript/Python y semillas SQL.

## 3. Reglas de negocio detectadas

### 3.1 Convención del análisis

- **Detectada:** existe explícitamente en código o documentación actual.
- **Aprobada:** decisión final del módulo de rendimiento; prevalece sobre comportamientos legacy detectados.
- **Propuesta:** diseño inicial sugerido; no está aprobado ni implementado.
- **Pendiente de confirmación:** existe ambigüedad o contradicción que debe resolver negocio.

### 3.2 Reglas operacionales

| Tema | Regla | Estado | Fuente / observación |
|---|---|---|---|
| Corte en poste | Una medida normalizada “corte en poste” se clasifica como corte. | Detectada | `cleaning_engine/rules.py` y `classifier.py`. |
| Corte en empalme | “corte en empalme” se clasifica como corte. | Detectada | Motor de limpieza. |
| Desmantelamiento | Desmantelamiento/retiro/reposición de empalme suma a `corte_en_empalme` por regla histórica. | Detectada, pendiente de confirmación | Comentario explícito en `calculator.py`; debería tener tipo propio en el detalle. |
| Fuera de rango | Con foto válida se clasifica como `corte_fuera_de_rango`; sin foto pasa a visita fallida. | Detectada | `classifier.py`. |
| Doble clasificación fuera de rango | `corte_fuera_de_rango` pertenece a categorías de cortes y reconexiones. | Detectada, pendiente de confirmación urgente | Puede duplicar la misma actividad en `total_actividades`. |
| Reconexión | Reposición en poste/empalme/acometida y auto-repuesto cuentan como reconexión. | Detectada | `rules.py`. |
| Visita fallida | Sin acceso, no ubicado, casa cerrada, caso sensible, cliente sin acceso, zona peligrosa, persona enferma y capturador cuentan como fallida. | Detectada | Catálogo hardcodeado en `rules.py`. |
| Total cortes | `corte_en_poste + corte_en_empalme + corte_fuera_de_rango`. | Detectada | Servicios de resultados, resumen y reporte. |
| Total actividades | `reconexiones_ejecutadas + total_cortes`. | Detectada | Resumen y reporte; hereda el posible doble conteo anterior. |
| Deduplicación | Primero por número de aviso; sin aviso, por SAP + fecha + timestamp + medida. | Detectada | `deduplicator.py`. Solo opera dentro del lote cargado. |
| Fecha operacional | Un lote Excel solo puede tener una fecha y debe coincidir con la fecha seleccionada. | Detectada | `cleaning_engine/service.py`. |
| Cumplimiento programado | `total_cortes / corte_programado`. | Detectada | `ResumenZonaService` y reporte gerencial. |
| Cumplimiento por meta | En resumen: `total_cortes / (brigadas_reportadas × meta)`. En gerencial: `promedio_actividades / meta`. | Detectada, inconsistente | Se debe elegir un numerador oficial y nombres inequívocos. |
| Cumplimiento por carga | La documentación lo define como `total_cortes / asignacion_carga`; el servicio gerencial usa `total_cortes / corte_programado`. | Pendiente de confirmación | `asignacion_carga` y `corte_programado` no deben tratarse como sinónimos. |
| Acumulados horarios | Cantidad de cortes ejecutados antes de las 09:00…14:00. | Detectada | `calculator.py`; usa una hora máxima global del lote para decidir `null` o valor. |

### 3.3 Reglas por técnico

El backend ya consolida Excel por `fecha_operacional + codigo_sap`, pero aún no existe un dominio de rendimiento técnico persistido.

| Métrica/regla | Definición recomendada | Estado |
|---|---|---|
| Productividad diaria | `corte_en_poste + corte_en_empalme + corte_fuera_de_rango`. Reconexiones y fallidas se conservan separadas. | Aprobada. |
| Productividad promedio | Promedio de cortes productivos sobre días evaluables del período solicitado. | Aprobada; las ausencias no participan. |
| Mejor productividad | **Propuesta:** máximo diario del período, guardando fecha y meta vigente. | Propuesta. |
| Cumplimiento diario | `cortes_productivos / meta_aplicada × 100`. | Aprobada; `meta_aplicada` queda en el snapshot. |
| Días bajo rendimiento | Cantidad de días evaluables con cumplimiento `< 50%`. | Aprobada. |
| Días consecutivos bajo 50% | Racha de días evaluables con cumplimiento `< 50%`; una ausencia no rompe ni reinicia la racha. | Aprobada. |
| Estado del técnico | Derivado por motor de reglas versionado, nunca seleccionado libremente desde la UI salvo override auditado. | Propuesta. |
| Fase actual | Estado persistido con inicio, motivo, regla disparadora, responsable y próxima revisión. | Propuesta. |
| Recomendación operacional | Generada desde reglas y editable/aprobable por supervisor, conservando autoría e historial. | Propuesta. |
| Reducción de frustrados | **Propuesta:** comparar tasa de visitas fallidas por actividad o carga entre ventanas equivalentes, no solo cantidades absolutas. | Pendiente de fórmula y ventana. |

### 3.4 Reglas por brigada

| Tema | Regla | Estado |
|---|---|---|
| Tipo | Solo `PXQ` o `CF`. | Detectada en checks y validaciones. Conviene catálogo/FK, no texto repetido. |
| Disponibilidad CF | Documentación y cliente limitan CF a Talca/Coquimbo o a supervisores específicos. | Detectada en frontend, pendiente de modelado oficial. Debe persistirse como asignación/permiso. |
| Estado | Solo `Operativa` o `Inactiva`; una inactiva exige observación. | Detectada en servicio. Falta constraint equivalente en BD. |
| Denominador de productividad | La documentación dice que una inactiva descuenta la base de meta. | Detectada documentalmente, no aplicada por servicios actuales, que cuentan todas las filas. |
| Zona | Se deriva de comuna/mapeo y queda guardada como texto. | Detectada. Debe usar `zona_id` y conservar la comuna fuente. |
| Supervisor | SAP y comuna se vinculan a un supervisor. | Detectada. La asignación actual no tiene vigencia histórica robusta. |
| Carga/cortes/reconexiones programados | Nacen en bitácora y se agregan por zona/tipo. | Detectada. Actualmente también se guardan por brigada y en programación de zona. |
| Unicidad diaria | **Propuesta:** una asignación activa por fecha + técnico, salvo brigada doble explícita. | Pendiente; hoy no hay unique constraint y el motor detecta duplicados después. |

### 3.5 Reglas por zona

| Métrica | Definición actual o propuesta | Estado |
|---|---|---|
| Corte programado | Suma o valor consolidado de cortes programados por zona/tipo/fecha. | Detectada, pero puede provenir de filas de brigada y de tabla de programación. Definir autoridad. |
| Carga asignada | Valor editable de bandeja por zona/tipo/fecha; no necesariamente suma de cortes por brigada. | Detectada documentalmente. |
| Reconexiones programadas | Total por zona/tipo/fecha. | Detectada. |
| Avance diario | **Propuesta:** ejecutado acumulado / objetivo correspondiente, con instante de cálculo. | Propuesta. |
| Promedio cortes | `total_cortes / brigadas consideradas`. | Detectada; pendiente si denominador excluye inactivas. |
| Promedio reconexiones | `reconexiones_ejecutadas / brigadas consideradas`. | Detectada. |
| Promedio actividades | `(cortes + reconexiones) / brigadas consideradas`. | Detectada; revisar doble conteo de fuera de rango. |
| Total ejecutado | Total de cortes y, por separado, total de actividades. | Propuesta de nomenclatura para evitar ambigüedad. |
| Fallidas por zona | Suma de visitas fallidas; agregar tasa `fallidas / intentos` cuando exista denominador fiable. | Cantidad detectada; tasa propuesta. |

### 3.6 Semáforo y fases aprobados

| Estado | Regla aprobada | Salvaguardas |
|---|---|---|
| Crítico | PXQ 0–12; CF 0–2 cortes productivos. | Una ausencia justificada no cuenta como día productivo. |
| En recuperación | PXQ 13–24; CF 3–5 cortes productivos. | Se evalúa exclusivamente con cortes productivos. |
| Estable | PXQ 25–29; CF 6 o más mientras no complete la racha de alto desempeño. | El borde PXQ 30+ antes de completar racha sigue pendiente. |
| Alto desempeño | Cumplir la meta durante tres días evaluables consecutivos. | Las fallidas no alteran la categoría ni la racha. |

**Fases propuestas**

- **Fase 1 — seguimiento preventivo:** fase inicial; alertas y revisión ordinaria.
- **Fase 2 — seguimiento reforzado:** activar automáticamente al completar 3 días operacionales elegibles consecutivos bajo 50% de la meta. Registrar fecha, regla, evidencias y responsable.
- **Fase 3 — intervención formal:** se activa cuando un técnico en Fase 2 acumula tres advertencias activas registradas por Torre de Control.
- **Desescalamiento:** nunca es automático; requiere aprobación y motivo de Torre de Control.

## 4. Reglas de negocio faltantes o pendientes de confirmación

1. Diferencia semántica y fórmula de `corte_programado` versus `asignacion_carga` para KPIs ajenos al módulo.
2. Ventana de consulta predeterminada para promedio y mejor productividad.
3. Estado PXQ para 30 o más cortes antes de completar la racha de alto desempeño.
4. Fórmula de reducción de frustrados y denominador de tasa de fallidas.
5. Reglas de calidad, seguridad, reclamos, cursos y protocolos usadas por los semáforos mock.
6. Flujo detallado de aprobación y salida de fases, siempre bajo Torre de Control.
7. Vigencia histórica de supervisor, zona, patente y tipo de brigada.
8. Política de reapertura de día operacional y bloqueo de ediciones históricas.

## 5. Análisis de base de datos

### 5.1 Tablas existentes según ORM y scripts

No se consultó un servidor PostgreSQL en vivo. “Existe” en esta sección significa **definida por el ORM y/o scripts del repositorio**; el esquema desplegado debe inventariarse con una consulta de solo lectura antes de migrar.

| Tabla | Propósito actual | Observaciones |
|---|---|---|
| `reportes_cyr` | Cabecera por fecha y estado. | No tiene relación física declarada en ORM con datos diarios. |
| `control_brigadas_diario` | Asignación y resultados consolidados por brigada/técnico/día. | Mezcla identidad, programación, estado y métricas; no tiene unicidad fecha+SAP ni FKs. |
| `control_programacion_zona` | Programación por fecha, zona y tipo. | Unique compuesto correcto, pero zona y tipo siguen siendo texto. |
| `control_parametros_zona` | Dotación contratada por zona/tipo. | Actúa también como catálogo de zonas; no guarda vigencia. |
| `control_parametros_generales` | Meta y horarios generales. | Permite múltiples filas activas; los servicios usan `.first()`. |
| `control_resultados_reales_zona` | Consolidado persistido por zona/fecha. | El flujo actual calcula desde brigadas y no usa el repositorio; riesgo de tabla obsoleta o desincronizada. |
| `control_parametros_cf_generales` | Parámetros generales CF. | Solapa el modelo general. Incluye metas horarias y umbrales no presentes para PXQ. |
| `control_parametros_cf_zona` | Dotación CF por zona. | Solapa `control_parametros_zona` con `tipo_brigada='CF'`. |
| `control_programacion_cf_zona` | Programación CF (legacy). | Solapaba `control_programacion_zona`. Desde Stage 7 la tabla oficial es `control_programacion_zona` con `tipo_brigada='CF'`. Legacy se conserva temporalmente. |
| `dim_tipo_brigada_usuario` | Tipo de brigada por nombre normalizado. | Duplica información disponible en maestro SAP; usa nombre como clave en lugar de técnico/SAP. |
| `control_supervisores` | Maestro de supervisores. | Falta identificador de negocio único y vínculo ORM con usuario. |
| `control_supervisor_comunas_zonas` | Asignación supervisor–comuna–zona. | SQL 002 crea FK; ORM no la declara. No tiene vigencia. |
| `control_supervisor_usuarios_sap` | Asignación supervisor–SAP y atributos habituales. | SQL 002 crea FK; unicidad por supervisor permite potencialmente el mismo SAP en varios supervisores. |
| `control_usuarios` | Usuarios de aplicación y roles. | Creada por `create_all`/seed, no por migración SQL versionada. `supervisor_id` no tiene FK declarada. |

### 5.2 Problemas estructurales

- **Deriva de esquema:** SQL, scripts Python y modelos ORM pueden crear estructuras distintas.
- **Integridad referencial parcial:** las FKs de supervisor existen en un SQL, pero no en SQLAlchemy; las demás relaciones usan texto.
- **Sin catálogo canónico de zonas:** la zona se repite en programación, parámetros, brigadas, reglas y frontend.
- **Sin entidad técnico:** SAP, nombre, tipo, supervisor y zona están mezclados en mapeos.
- **Sin detalle transaccional de actividades:** Excel se reduce a totales diarios; no se conserva `aviso_id`, categoría, evidencia, archivo y timestamp como registros auditables.
- **Sin historial de asignaciones:** cambiar supervisor/zona/tipo reescribe el presente sin modelar vigencia.
- **Consolidados ambiguos:** se guardan resultados diarios en brigadas y existe una tabla de resultado por zona no usada.
- **Sin versionado de reglas/metas:** recalcular historia con una regla nueva podría cambiar resultados antiguos.
- **Tipos y estados como texto:** hay checks parciales, pero faltan catálogos o enums consistentes.
- **Índices insuficientes:** se necesitan índices por fecha+técnico, técnico+fecha, zona+fecha, supervisor+vigencia y estado/fase.

### 5.3 Estructura tentativa propuesta

Los nombres son tentativos. La migración debe coexistir con las tablas actuales hasta validar paridad.

#### Tablas maestras

| Tabla propuesta | Columnas principales | Relaciones / restricciones |
|---|---|---|
| `zonas` | `id`, `codigo`, `nombre`, `activa` | `codigo` y nombre normalizado únicos. |
| `comunas` | `id`, `codigo`, `nombre`, `zona_id`, `activa` | FK a `zonas`; elimina mapeos Python/TS. |
| `supervisores` | `id`, `codigo`, `nombre`, `activo` | Sustituye/normaliza `control_supervisores`. |
| `control_supervisor_usuarios_sap` | `id`, `codigo_sap`, `cuenta`, `supervisor_id`, `tipo_brigada`, `activo` | Maestro existente reutilizado. La migración impide más de una asignación activa por `codigo_sap`. |
| `tipos_brigada` | `id`, `codigo` (`PXQ`, `CF`), `nombre`, `activo` | Código único. |
| `brigadas` | `id`, `codigo`, `patente`, `tipo_brigada_id`, `activa` | Definir si patente identifica brigada o vehículo; pendiente de negocio. |
| `usuarios_aplicacion` | `id`, `usuario`, `password_hash`, `rol_id`, `supervisor_id`, `activo` | FKs y usuario único. Roles/permisos normalizados o enum estable. |
| `motivos_visita_fallida` | `id`, `codigo`, `nombre`, `requiere_evidencia`, `activo` | Reemplaza set hardcodeado. |
| `tipos_actividad` | `id`, `codigo`, `nombre`, flags de corte/reconexión/fallida | La clasificación efectiva debe tener vigencia/versionado. |

#### Asignaciones con vigencia

| Tabla propuesta | Objetivo |
|---|---|
| `supervisor_zona_vigencia` | Qué zonas/comunas puede operar un supervisor en un período. |
| `asignacion_sap_supervisor_vigencia` | Evolución futura del responsable de una cuenta SAP por rango de fechas. |
| `asignacion_sap_tipo_vigencia` | Evolución futura del tipo aplicable por rango de fechas. |
| `asignacion_sap_brigada_vigencia` | Evolución futura de la pertenencia a una brigada cuando aplique. |

#### Tablas transaccionales

| Tabla propuesta | Columnas principales / objetivo |
|---|---|
| `jornadas_brigada` | Fecha, brigada/técnico, zona, supervisor, tipo, estado, observación, programación. Unique según regla de asignación diaria aprobada. Evolución de `control_brigadas_diario`. |
| `programacion_zona_diaria` | Fecha, zona, tipo, carga asignada, cortes y reconexiones programadas. Unique fecha+zona+tipo. |
| `lotes_importacion` | Archivo, checksum, fecha, usuario, estado, filas leídas/rechazadas, timestamps. |
| `actividades_operacionales` | `aviso_id`, técnico, jornada, tipo, fecha/hora, comuna/zona, foto/evidencia, lote origen. `aviso_id` único cuando exista. |
| `visitas_fallidas` | Actividad, técnico, motivo, detalle, evidencia y fecha. Puede derivarse de actividad, pero merece dimensión analítica clara. |

#### Productividad y rendimiento

| Tabla propuesta | Responsabilidad |
|---|---|
| `rendimiento_tecnico_diario` | Snapshot por SAP+fecha: componentes, reconexiones, fallidas, meta aplicada, cumplimiento, evaluabilidad y estado diario. |
| `rendimiento_tecnico_actual` | Estado, fase y rachas vigentes; una fila por `codigo_sap`. |
| `rendimiento_tecnico_historial` | Cambios de estado/fase, advertencias, recálculos y overrides. |
| `rendimiento_tecnico_advertencias` | Advertencias formales activas/anuladas que gobiernan el paso a Fase 3. |
| `rendimiento_tecnico_ausencias` | Justificaciones de días no evaluables. |
| `rendimiento_tecnico_causas_fallidas` | Desglose analítico de fallidas, sin impacto en productividad. |

#### Parámetros y metas

| Tabla propuesta | Responsabilidad |
|---|---|
| `parametros_operacionales` | Parámetro tipado, alcance global/zona/tipo, valor, unidad, vigencia y versión. |
| `metas_por_tipo_brigada` | Tipo, zona opcional, meta de cortes/reconexiones/actividades, vigencia. No sobrescribir metas históricas. |
| `metas_horarias` | Tipo/zona, hora de corte, meta acumulada y vigencia. |
| `catalogo_estados_brigada` | Operativa, inactiva y futuros estados con reglas permitidas. |

#### Métricas calculadas

Preferir vistas SQL o consultas de servicio para agregados simples. Persistir `rendimiento_tecnico_diario` porque requiere reproducibilidad histórica mediante componentes, meta aplicada y timestamps. Usar vistas/materialized views solo cuando haya evidencia de necesidad de rendimiento, por ejemplo:

- `vw_productividad_zona_diaria`;
- `vw_ranking_tecnicos_periodo`;
- `mv_resumen_gerencial_diario` si el volumen lo justifica.

### 5.4 Relaciones clave propuestas

```text
usuarios_aplicacion -> supervisores
supervisores -> supervisor_zona_vigencia -> zonas
control_supervisor_usuarios_sap -> supervisor + cuenta SAP activa
jornadas_brigada -> cuenta SAP + brigada + zona + supervisor + tipo_brigada
actividades_operacionales -> jornada_brigada + cuenta SAP + lote_importacion
visitas_fallidas -> actividad_operacional + motivo_visita_fallida
rendimiento_tecnico_diario -> codigo_sap + bitácora + meta aplicada
rendimiento_tecnico_actual -> codigo_sap + fase vigente
rendimiento_tecnico_historial -> codigo_sap + regla/fase + usuario autor
```

## 6. Datos que deben pasar a base de datos

| Archivo actual | Dato encontrado | Problema | Recomendación | Tabla sugerida | Prioridad |
|---|---|---|---|---|---|
| `frontend/src/data/rendimientoTecnico.mock.ts` | `MOCK_TECNICOS` | Técnicos, SAP, zona, supervisor, estado y fase ficticios. | Reemplazar por consulta al maestro y rendimiento vigente. | `control_supervisor_usuarios_sap`, `rendimiento_tecnico_actual` | Alta |
| mismo archivo | `MOCK_KPIS` | KPIs no dependen del técnico ni fecha seleccionados. | Calcular en backend por período y meta aplicada. | `rendimiento_tecnico_diario` | Alta |
| mismo archivo | `MOCK_SEMAFOROS` | Estados y descripciones manuales. | Evaluar reglas backend y devolver evidencia. | `reglas_rendimiento`, `hallazgos_tecnico` | Alta |
| mismo archivo | `MOCK_FASE` | Fase, motivo, fechas y responsable ficticios. | Persistir estado vigente e historial. | `rendimiento_tecnico_actual`, `rendimiento_tecnico_historial` | Alta |
| mismo archivo | `MOCK_CURSOS` | Cursos y vencimientos ficticios. | Integrar fuente oficial o crear módulo de capacitación. | `cursos`, `tecnico_curso` (si se confirma alcance) | Media |
| mismo archivo | `MOCK_HALLAZGOS` | Hallazgos y frecuencias manuales. | Generar desde reglas y permitir gestión auditada. | `hallazgos_tecnico` | Alta |
| mismo archivo | `MOCK_RECOMENDACION` | Recomendación y prioridad manuales. | Persistir flujo de recomendación/seguimiento. | `recomendaciones_tecnico` | Alta |
| `frontend/src/components/rendimiento/RendimientoTecnicoKpiCards.tsx` | Umbrales visuales 80%/50%; “día crítico” 0 o 1 corte | Regla vive en UI y no está aprobada. | Parametrizar/evaluar en backend; UI solo colorea estado recibido. | `reglas_rendimiento` | Alta |
| `frontend/src/components/rendimiento/RendimientoTecnicoFaseSeguimiento.tsx` | Nombres/semántica de fases | Presentación incluye significado de negocio. | Servir fase y estado desde API; los textos visuales pueden permanecer en UI si son solo copy. | `rendimiento_tecnico_actual` | Media |
| `frontend/src/auth/supervisoresTemp.ts` | Usuarios, contraseñas, zonas, supervisor IDs, permisos CF | Seguridad y permisos dependen del cliente. | Eliminar fallback tras migrar usuarios, roles y asignaciones. | `usuarios_aplicacion`, asignaciones, permisos | Alta |
| `frontend/src/pages/LoginPage.tsx` | Fallback local y bypass de administrador | Permite acceso sin autenticación backend. | Retirar cuando auth real esté validada. | No aplica; política de seguridad | Alta |
| `backend/scripts/seed_users.py` | Usuarios y contraseña común `admin123` | Credenciales conocidas y IDs frágiles. | Seed solo para desarrollo, parametrizado y bloqueado en producción. | `usuarios_aplicacion` | Alta |
| `backend/app/core/config.py` | `SECRET_KEY` por defecto | Firma JWT predecible si falta variable de entorno. | Exigir secreto seguro al iniciar fuera de test. | Secret manager / entorno, no BD | Alta |
| `backend/alter.py` | URL PostgreSQL con credencial | Secreto expuesto en archivo versionable. | Rotar credencial y retirar el archivo del flujo. | Secret manager / entorno, no BD | Alta |
| `backend/app/repositories/configuracion_repository.py` | Lista fija de 7 zonas | Alta/baja de zonas requiere despliegue. | Consultar catálogo de zonas. | `zonas` | Alta |
| mismo archivo | Metas 30 PXQ, 6 CF, 15 reconexiones, horarios y tramos | Parte no se persiste y lo editado en UI no se guarda. | Persistir por alcance y vigencia. | `parametros_operacionales`, `metas_por_tipo_brigada`, `metas_horarias` | Alta |
| mismo archivo | Flags de automatización siempre `true` | Configuración aparente pero no efectiva/persistente. | Persistir o retirar de UI hasta estar soportada. | `parametros_operacionales` | Alta |
| `backend/app/cleaning_engine/rules.py` | Catálogo de medidas y fallidas | Cambiar clasificación requiere código/despliegue. | Llevar reglas estables a catálogo versionado; mantener código para algoritmo. | `tipos_actividad`, `motivos_visita_fallida`, reglas de clasificación | Alta |
| mismo archivo | `PROCESO_A_ZONA`, `COMUNA_A_ZONA` | Maestro geográfico duplicado. | Resolver por IDs/catálogos BD. | `zonas`, `comunas`, `procesos_operacionales` | Alta |
| mismo archivo | `USUARIO_ALIAS` con SAP/nombres | Correcciones personales dentro del código. | Consolidar alias auditados sobre el maestro SAP existente. | `control_supervisor_usuarios_sap` | Alta |
| `backend/sql/001_fase_2_base_datos_minima.sql` | Zonas, dotaciones, meta 30 y usuarios CF | Seed inicial mezclado con DDL y datos cambiantes. | Separar migración estructural de seed versionado. | Catálogos/metas/asignaciones | Alta |
| `backend/sql/002`, `005`, `007`, `010` | Supervisores y maestro SAP | Varias versiones corrigen/duplican personas y asignaciones. | Importador idempotente al maestro SAP con vigencia y validación. | `control_supervisores`, `control_supervisor_usuarios_sap` | Alta |
| `backend/app/models/cyr_models.py` | Defaults de 30, 6, horarios y umbrales CF | Defaults de esquema pueden contradecir negocio. | Dejar defaults técnicos mínimos; metas reales en tablas con vigencia. | Parámetros/metas | Alta |
| `frontend/src/components/supervisor/SupervisorBitacoraLogic.ts` | Validaciones SAP, zona, patente y agregados | Se pueden omitir llamando directamente a API. | Duplicar solo validación UX; autoridad en backend/BD. | Maestros + constraints | Alta |

Los colores, sombras y estilos de `CONFIG_*` del mock son configuración visual y **deben permanecer en frontend**; solo los estados, umbrales y textos de negocio deben provenir del backend.

## 7. Archivos innecesarios o sospechosos

No eliminar aún. Clasificación para una futura limpieza controlada:

### Candidatos de alta confianza

- `frontend/src/components/supervisor/script.py` … `script7.py`: scripts de parche local dentro del código fuente.
- `backend/test_db.py` … `test_db7.py`: inspecciones manuales sin aserciones.
- `backend/fix_db.py`, `fix_db2.py`, `alter.py`, `check.py`: operaciones ad hoc con rutas/datos/credenciales locales.
- `backend/app/cleaning_engine/test_run.py`: ejecución manual dentro del paquete.

### Candidatos que requieren confirmar consumidores

- `frontend/src/components/cyr/CyrDashboardView.tsx`.
- `frontend/src/components/reporte-gerencial/ReporteGerencialDashboardView.tsx` frente a la página gerencial activa.
- `backend/app/repositories/resultado_real_zona_repository.py` y `control_resultados_reales_zona`.
- `frontend/src/assets/react.svg` y `vite.svg`.
- tablas, rutas, schemas y repositorios CF específicos después de consolidar datos.

### Archivos que no son innecesarios, pero deben reorganizarse

- SQL 001–011: conservar como evidencia histórica hasta introducir migraciones formales.
- `seed_supervisores_piloto.py` y `seed_users.py`: mover al esquema formal de seeds por ambiente.
- `docs/skills/*`: conservar, indicando fecha/versión y evitando que documentación antigua se trate como especificación vigente.

## 8. Propuesta de arquitectura backend

### 8.1 Principios

1. La ruta valida transporte/autorización y delega.
2. El servicio de aplicación orquesta transacciones y casos de uso.
3. Las políticas/cálculos de dominio contienen reglas puras y testeables.
4. El repositorio consulta/persiste, sin definir reglas de negocio.
5. La BD asegura identidad, relaciones, unicidad y auditoría.
6. Toda regla variable tiene versión y vigencia.
7. Los agregados enviados a UI tienen nombres y fórmulas documentados.

### 8.2 Estructura objetivo incremental

```text
backend/app/
  api/
    v1/
      router.py
  core/
    config.py
    database.py
    security.py
    errors.py
  modules/
    maestros/
      routes.py
      schemas.py
      service.py
      repository.py
      models.py
    operacion_diaria/
      routes.py
      schemas.py
      service.py
      policies.py
      repository.py
      models.py
    productividad/
      routes.py
      schemas.py
      service.py
      calculator.py
      rules_engine.py
      repository.py
      models.py
    rendimiento/
      routes.py
      schemas.py
      service.py
      policies.py
      repository.py
      models.py
    reportes/
      routes.py
      schemas.py
      service.py
      repository.py
    importaciones/
      routes.py
      schemas.py
      service.py
      cleaning_engine/
  migrations/          # Alembic
  seeds/               # idempotentes y separados por ambiente
  tests/
    unit/
    integration/
```

No es necesario mover todos los archivos de una vez. Primero puede crearse `modules/productividad` y dejar adaptadores hacia tablas legacy.

### 8.3 Responsabilidades específicas

- **Rutas/endpoints:** parámetros HTTP, filtros, paginación, códigos de respuesta y dependencias de permisos.
- **Schemas:** contratos separados para create/update/read; validaciones de rango y enums.
- **Servicios:** transacciones completas; un bulk debe hacer un solo commit o rollback.
- **Reglas de negocio:** funciones puras para productividad, rachas, semáforo y fases.
- **Repositorios:** queries eficientes y filtradas por permisos; no commits por cada fila.
- **Modelos:** FKs, índices, constraints, timestamps y relaciones.
- **Cálculos:** recibir datos y versión de parámetros; devolver resultado más evidencia.
- **Seeds:** solo catálogos mínimos, idempotentes; nunca contraseñas fijas de producción.
- **Migraciones:** una única herramienta formal con revisión de upgrade/downgrade y respaldo.
- **Auditoría:** actor, fecha, motivo y valores anterior/nuevo en cambios sensibles.

## 9. Propuesta de arquitectura frontend

```text
frontend/src/
  app/
    router.tsx
    providers.tsx
  features/
    productividad/
      pages/
      components/
      hooks/
      api/
      adapters/
      types/
    operacion-diaria/
    supervisores/
    reportes/
    configuracion/
  shared/
    components/
    hooks/
    api/
    utils/
    types/
  auth/
    AuthProvider.tsx
    permissions.ts
```

### Reglas de separación

- **Vistas:** componen layout y estados de carga/error; no calculan cumplimiento.
- **Componentes visuales:** reciben props; no importan mocks ni llaman directamente a Axios.
- **Componentes de negocio:** coordinan componentes, pero consumen hooks de caso de uso.
- **Hooks:** gestionan caché, filtros, carga y mutaciones; no son autoridad de reglas.
- **Servicios API:** una función por caso de uso, contratos tipados y manejo común de errores.
- **Tipos TypeScript:** derivados/alineados con OpenAPI; no duplicar contratos en hooks y `types/`.
- **Adaptadores:** convierten DTO del backend a view model (fechas, labels, colores), sin recalcular KPIs.
- **Estado local:** selección, búsqueda, tab activa, formulario no guardado y modales.
- **Permisos:** la UI oculta acciones por UX, pero el backend siempre revalida.

### Prioridades de frontend

1. Retirar import directo de `rendimientoTecnico.mock.ts` al conectar endpoints.
2. Dividir `SupervisorBitacoraView.tsx` en contenedor, formulario, tabla, resumen y hooks.
3. Consolidar las dos vistas de reporte gerencial.
4. Eliminar correcciones de KPIs ya calculados por backend.
5. Sustituir `any` en payloads y usuario por contratos explícitos.
6. Reemplazar el fallback de autenticación solo después de probar roles backend.

## 10. Propuesta de endpoints de productividad y rendimiento

Se propone versionar como `/api/v1`. Si se mantiene el prefijo actual, los mismos recursos pueden exponerse temporalmente bajo `/api/productividad`.

| Método y endpoint | Objetivo | Retorna / recibe | Fuente principal | Cálculo | Prioridad |
|---|---|---|---|---|---|
| `GET /api/v1/productividad/tecnicos` | Buscar/listar técnicos con estado vigente. | Paginación, SAP, nombre, zona, supervisor, tipo, estado, fase, promedio. Filtros por fecha/zona/supervisor/estado. | `control_supervisor_usuarios_sap`, `rendimiento_tecnico_actual` | Agregado liviano | Alta |
| `GET /api/v1/productividad/tecnicos/{id}/resumen` | Ficha KPI del período. | Productividad diaria/promedio/máxima, meta, cumplimiento, rachas, fallidas y estado. | `rendimiento_tecnico_diario`, `rendimiento_tecnico_actual` | Sí | Alta |
| `GET /api/v1/productividad/tecnicos/{id}/historial` | Serie diaria auditable. | Filas por fecha con componentes, meta aplicada y cumplimiento. | `rendimiento_tecnico_diario` | No o mínimo | Alta |
| `GET /api/v1/productividad/tecnicos/{id}/hallazgos` | Consultar hallazgos y evidencia. | Hallazgos abiertos/cerrados, nivel, regla, fechas y acción. | `hallazgos_tecnico` | No | Alta |
| `GET /api/v1/productividad/tecnicos/{id}/estado-historial` | Trazar cambios de estado/fase. | Transiciones, motivo, regla y actor. | `rendimiento_tecnico_historial` | No | Alta |
| `GET /api/v1/productividad/tecnicos/{id}/recomendaciones` | Seguimiento supervisor. | Recomendaciones, prioridad, estado y fechas. | `recomendaciones_tecnico` | No | Media |
| `POST /api/v1/productividad/tecnicos/{id}/recomendaciones` | Registrar recomendación humana. | Recomendación creada. | `recomendaciones_tecnico` | Validación, no cálculo | Media |
| `GET /api/v1/productividad/ranking` | Ranking comparable por período. | Posición, productividad, cumplimiento, fallidas y elegibilidad. | `rendimiento_tecnico_diario` | Sí; filtros y mínimo de días | Media |
| `GET /api/v1/productividad/alertas` | Bandeja de técnicos que requieren acción. | Alerta, gravedad, evidencia, fase, responsable y antigüedad. | rendimiento, hallazgos, historial | Sí | Alta |
| `GET /api/v1/productividad/zonas/{zona_id}` | Resumen de productividad de zona. | Totales, promedios, distribución de estados y fallidas. | productividad, zonas, jornadas | Sí | Media |
| `GET /api/v1/productividad/reglas` | Consultar reglas vigentes y explicabilidad. | Versión, umbrales, ventana y vigencia. | `reglas_rendimiento`, fases, parámetros | No | Media |
| `POST /api/v1/productividad/recalcular` | Recalcular período de forma controlada. | `job_id`, rango, versión y estado. Solo rol autorizado. | actividades, jornadas, metas, reglas | Sí, intensivo | Alta |
| `GET /api/v1/productividad/recalculos/{job_id}` | Consultar resultado del recálculo. | Estado, filas, errores y versión. | `lotes_recalculo` o job store | No | Media |
| `PATCH /api/v1/productividad/tecnicos/{id}/fase` | Override controlado de fase. | Fase nueva, motivo, actor y transición. | rendimiento + historial | Validación de transición | Alta |
| `PATCH /api/v1/productividad/hallazgos/{id}` | Gestionar estado de hallazgo. | Hallazgo actualizado y auditoría. | hallazgos + historial | No | Media |

Requisitos transversales:

- autorización por rol y alcance de supervisor/zona;
- rango de fechas obligatorio y zona horaria operacional explícita;
- paginación y ordenamiento;
- versión de regla/meta en respuestas calculadas;
- idempotencia para recalcular/importar;
- no aceptar un estado/fase calculado desde el cliente como verdad.

## 11. Riesgos técnicos

| Severidad | Riesgo | Evidencia actual | Impacto |
|---|---|---|---|
| Crítico | Bypass de autenticación y credenciales en frontend | `LoginPage.tsx`, `supervisoresTemp.ts`, botón “Entrar como Administrador”. | Acceso no autorizado y permisos falsificables. |
| Crítico | Secretos/credenciales hardcodeados | `backend/alter.py`, `SECRET_KEY` por defecto, seeds con `admin123`. | Compromiso de BD/JWT; rotación necesaria antes de producción. |
| Crítico | Autorización backend insuficiente | Varios POST solo prohíben `gerencia`; un supervisor autenticado podría modificar configuración/programación global. | Alteración de operación fuera del alcance asignado. |
| Alto | Endpoints y ruta gerencial de lectura sin protección | Reportes, brigadas, configuración y resúmenes GET no exigen token; ruta React gerencial no está protegida. | Exposición de información operacional. |
| Alto | Múltiples fuentes de verdad para metas y cumplimiento | 25 solicitado, 30 PXQ, 6 CF; cortes vs actividades; carga vs programado. | KPIs gerenciales incompatibles y decisiones erróneas. |
| Alto | Rendimiento técnico completamente mock | Datos y reglas salen de `rendimientoTecnico.mock.ts`. | Estados/fases aparentan ser reales sin respaldo. |
| Alto | Falta de integridad y maestros normalizados | Zonas/SAP/supervisores como strings y FKs parciales. | Huérfanos, duplicados y pérdida de trazabilidad. |
| Alto | Sin detalle/auditoría de actividades importadas | Solo se actualizan totales en brigada diaria. | No se puede explicar ni reproducir un KPI ni deduplicar entre lotes. |
| Alto | Posible doble conteo de fuera de rango | La categoría suma como corte y reconexión. | Total de actividades y cumplimiento inflados. |
| Alto | Brigadas inactivas no se excluyen del denominador | Servicios usan cantidad total aunque documentación indica descuento. | Cumplimiento incorrecto. |
| Alto | Migraciones no versionadas formalmente | SQL + scripts Python + `create_all`. | Entornos con esquemas diferentes y despliegues irreproducibles. |
| Alto | Configuración que parece editable pero no se persiste | El repositorio solo guarda zona activa/dotación. | Usuario cree haber cambiado metas/reglas, pero se pierden al recargar. |
| Alto | Requisitos backend incompletos | Faltan pandas, Excel, JWT y bcrypt. | Instalaciones y despliegues fallan. |
| Alto | Actualización Excel por fecha+SAP sin unicidad | Un SAP duplicado puede actualizar varias filas; no existe unique constraint. | Resultados duplicados o asignados a brigada incorrecta. |
| Medio | Lógica de negocio en React | Bitácora, reporte, copiado de día, cálculos de tabla y umbrales. | Desfase entre clientes y API. |
| Medio | Duplicación de reportes y doble fetch | Dos implementaciones gerenciales; hook y componente llaman `fetchReporte`. | Mantenimiento duplicado y llamadas innecesarias. |
| Medio | Componente supervisor de 1.089 líneas | UI, red, permisos y persistencia juntos. | Alta regresión y baja testeabilidad. |
| Medio | Operaciones bulk no atómicas | Repositorios hacen commit por elemento y frontend dispara múltiples POST. | Día parcialmente guardado ante fallo de red. |
| Medio | Validaciones numéricas incompletas | Ejecutados/acumulados pueden ser negativos; estados solo validados en servicio. | Datos inválidos en BD. |
| Medio | `create` de brigada omite `corte_fuera_de_rango` | Schema y modelo tienen el campo, el repositorio no lo copia al crear. | Pérdida silenciosa del dato enviado. |
| Medio | Excepciones de conexión silenciadas | `database.py` captura cualquier excepción al crear engine. | Fallos tardíos difíciles de diagnosticar. |
| Medio | Sin pruebas automatizadas | No hay pytest/unittest/asserts; `test_db*.py` solo imprime. | Fórmulas sensibles sin red de seguridad. |
| Medio | Tabla consolidada potencialmente abandonada | `control_resultados_reales_zona` no alimenta el endpoint actual. | Datos desincronizados y costo operativo. |
| Bajo | Residuos de plantilla y documentación antigua | SVG Vite/React, README de “Fase 1”. | Ruido y onboarding deficiente. |
| Bajo | Nomenclatura inconsistente | corte/carga/productividad/actividad, `cuenta`/`usuario`, CF paralelo. | Errores de interpretación y contratos confusos. |

## 12. Plan de implementación por etapas

### Etapa 1 — diagnóstico y decisiones

- **Objetivo:** consolidar este informe, aprobar glosario, fórmulas, metas, fases y fuentes de verdad.
- **Archivos probables:** `docs/analisis_arquitectura_negocio.md`, documento funcional y ADRs nuevos.
- **Riesgo:** bajo; el principal riesgo es aprobar reglas ambiguas.
- **Validación:** reunión con Operaciones, Torre de Control, Gerencia y responsable de datos; firmar matriz de decisiones.
- **No tocar:** código funcional, esquema, endpoints, estilos y datos reales.

### Etapa 2 — modelo y migraciones seguras

- **Objetivo:** introducir Alembic, inventariar esquema real, respaldar BD y crear maestros/relaciones/productividad sin retirar legacy.
- **Archivos probables:** configuración Alembic, nuevas migraciones, modelos por dominio, scripts de backfill auditables.
- **Riesgo:** alto por calidad de maestros y duplicados históricos.
- **Validación:** backup/restauración; conteos antes/después; detección de SAP/zonas huérfanos; constraints en staging; plan de rollback.
- **No tocar:** tablas CF legacy ni mocks de frontend hasta tener paridad; no borrar columnas/tablas actuales.

### Etapa 3 — endpoints base de productividad

- **Objetivo:** implementar lectura de técnicos, resumen, historial, ranking y alertas sobre datos reales.
- **Archivos probables:** `modules/productividad/*`, schemas, repositorios, políticas, tests unitarios/integración.
- **Riesgo:** alto por definición de fórmulas y rendimiento de consultas.
- **Validación:** casos dorados obtenidos de Excel/Power BI; pruebas de límites, rachas y permisos; explicar cada KPI.
- **No tocar:** componentes actuales de rendimiento y cálculo histórico masivo en producción.

### Etapa 4 — conectar frontend al backend

- **Objetivo:** reemplazar imports de mock por hooks/API/adaptadores, sin rediseñar la pantalla.
- **Archivos probables:** `features/productividad/api`, hooks, tipos y componentes `rendimiento/*`.
- **Riesgo:** medio por contratos, estados vacíos y latencia.
- **Validación:** comparación visual mock vs API; selección de fecha/técnico; carga/error/sin datos; permisos por rol.
- **No tocar:** estilos salvo ajustes mínimos para estados reales; no borrar mocks aún.

### Etapa 5 — retirar mocks y duplicaciones progresivamente

- **Objetivo:** eliminar fallback de datos de rendimiento, consolidar vistas gerenciales y limpiar scripts temporales confirmados.
- **Archivos probables:** `rendimientoTecnico.mock.ts`, reportes duplicados, scripts temporales, assets sin uso.
- **Riesgo:** medio; referencias ocultas o flujos de piloto.
- **Validación:** búsqueda de imports, build, lint, pruebas E2E por rol y checklist de pantallas.
- **No tocar:** SQL histórico ni tablas legacy sin completar migración/retención.

### Etapa 6 — reglas automáticas de rendimiento

- **Objetivo:** evaluar semáforos, rachas, fases, hallazgos y recomendaciones con reglas versionadas.
- **Archivos probables:** motor de reglas, jobs de cálculo, tablas de reglas/fases/historial, endpoints de override.
- **Riesgo:** alto por impacto laboral/operacional de una clasificación incorrecta.
- **Validación:** ejecución sombra sin cambiar fases; revisión humana; pruebas de calendario, reincidencia, desescalamiento y versionado.
- **No tocar:** estados históricos; no recalcularlos sin versión y autorización explícita.

### Etapa 7 — validación con datos reales y consolidación

- **Objetivo:** comparar plataforma con Excel/Power BI, corregir brechas y decidir retiro de tablas/rutas CF legacy.
- **Archivos probables:** consultas de reconciliación, reportes de calidad, migraciones finales y runbooks.
- **Riesgo:** alto por diferencias históricas y cambio operativo.
- **Validación:** paralelo por varias fechas/zonas; tolerancia acordada; aprobación de Gerencia; auditoría de muestras; plan de rollback.
- **No tocar:** fuente legacy hasta alcanzar paridad y completar respaldo/retención legal.

## 13. Recomendación final

Continuar con una modernización incremental, no con un refactor masivo. La identidad canónica del módulo es `control_supervisor_usuarios_sap.codigo_sap`; no se crea una tabla nueva de técnicos. Las reglas aprobadas usan exclusivamente cortes productivos, metas PXQ 25/CF 6, ausencias no evaluables y Fase 3 por tres advertencias activas en Fase 2.

Orden recomendado:

1. cerrar las decisiones remanentes de la sección 4 sin reabrir las reglas ya aprobadas;
2. corregir en una fase de seguridad separada las credenciales, bypass y autorización backend;
3. inventariar y respaldar el esquema PostgreSQL real;
4. validar las siete tablas aditivas y su integridad con los maestros legacy;
5. implementar productividad en backend con pruebas contra datos dorados;
6. conectar la UI y retirar mocks solo después de validar paridad;
7. automatizar fases cuando las reglas hayan operado en modo sombra.

La arquitectura actual puede evolucionar hacia este objetivo. Sus servicios, repositorios, schemas y motor de limpieza son una base reutilizable; el trabajo prioritario es volver coherentes las reglas, fortalecer la seguridad y hacer que la base de datos sea la fuente real y auditable.
