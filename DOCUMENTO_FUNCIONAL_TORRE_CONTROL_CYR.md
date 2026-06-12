# Manual funcional y levantamiento de brechas - Torre de Control CyR

## 1. Resumen ejecutivo
La plataforma Torre de Control CyR es una herramienta web diseñada para digitalizar y centralizar el flujo operativo diario de Corte y Reposición. Reemplaza los flujos manuales basados en archivos Excel dispersos. Permite que los **Supervisores** ingresen la "Bitácora" (las brigadas que salen a terreno y sus metas) y que la **Torre de Control** monitoree y actualice la ejecución (cortes y reconexiones) a lo largo del día. Finalmente, provee un **Reporte Gerencial** que resume el cumplimiento global en tiempo real.

## 2. Roles del sistema

| Rol | Usuario ejemplo | Acceso | Restricciones |
| --- | --------------- | ------ | ------------- |
| Superadmin / Admin | torre.control@cyr.cl | Todas las pantallas y configuraciones. | Ninguna. |
| Supervisor | juan.munoz@cyr.cl | Bitácora Supervisor. | Solo ve la pantalla de Bitácora. No accede a la edición de Torre de Control ni Reportes globales. |
| Torre de Control | analista@cyr.cl | Inicio del Día, Resumen General, Resumen por Zona. | No debería acceder a la bitácora directa del supervisor (aunque administrativamente lo puede suplir). |
| Gerencia | gerente@cyr.cl | Reporte Gerencial. | Rol proyectado de solo lectura (actualmente entra en Reporte Gerencial). |

## 3. Mapa de navegación

| Pantalla | Ruta | Rol con acceso | Objetivo |
| -------- | ---- | -------------- | -------- |
| Inicio del día | `/torre-control/inicio-dia` | Admin, Torre Control | Cargar base inicial de brigadas clonando el día anterior. |
| Resumen General | `/torre-control/dashboard-cyr` | Admin, Torre Control | Monitoreo por zona, edición de programación diaria y registro de avances reales. |
| Resumen por Zona | `/torre-control/resumen-zona` | Admin, Torre Control | Visualización tabular consolidada de KPIs por tipo de brigada y zona. |
| Reporte Gerencial | `#/reporte-gerencial` | Admin, Gerencia | Visualización gráfica y global del cumplimiento de meta y cortes. |
| Bitácora Supervisor | `/supervisor/bitacora` | Supervisor, Admin | Formulario de entrada inicial para que el supervisor reporte su dotación. |
| Configuración | `/torre-control/configuracion` | Admin | Ajustes de sistema y parámetros globales. |

---

## 4. Explicación pantalla por pantalla

### Bitácora Supervisor
**Ruta:** `/supervisor/bitacora`
**Área usuaria:** Supervisores de Terreno
**Rol autorizado:** Supervisor
**Objetivo:** Permitir al supervisor ingresar digitalmente las brigadas operativas del día, reemplazando el uso del Excel "Bitácora".

**Qué ve el usuario:**
Un panel de KPIs superior, un formulario para ingresar nuevas brigadas y una tabla con el listado de las brigadas ingresadas para la fecha seleccionada.

**Botones y acciones:**
| Botón / Acción | Qué hace | Impacto |
| -------------- | -------- | ------- |
| "Guardar Brigada" | Registra la nueva brigada en la base de datos | Impacta la tabla inferior inmediatamente y alimenta Torre de Control. |

**Campos editables:**
| Campo | Quién lo edita | Para qué sirve | Validación |
| ----- | -------------- | -------------- | ---------- |
| Patente | Supervisor | Identifica el vehículo de la brigada | Debe cumplir formato AA1111 o AAAA11 (6 caracteres). |
| Usuario SAP | Supervisor | Identificador SAP del operario | Inicia con P + 6 números. |
| Cuenta | Supervisor | Nombre del operario | Vinculado a SAP. |
| Tipo | Supervisor | Define tipo de contrato (PXQ o CF) | CF solo habilitado para Coquimbo y Talca. |
| Corte Prog. / Rec. Prog. / Asign. Carga | Supervisor | Define los valores base de programación por zona | Número mayor o igual a 0. |

**Datos calculados:**
| KPI / Métrica | Fórmula o lógica | Fuente |
| ------------- | ---------------- | ------ |
| Total Brigadas | Recuento total de brigadas listadas. | Datos en pantalla. |

**Endpoints utilizados:**
| Endpoint | Uso |
| -------- | --- |
| `/api/brigadas-dia` | GET y POST para visualizar y agregar brigadas. |

**Dependencias con otras pantallas:**
Alimenta el "Resumen General" de Torre de Control. Es el input primario del día.

**Problemas detectados / Riesgos:**
- Si un supervisor se equivoca de fecha operacional (selector superior), la información no se reflejará correctamente para la operación en curso.

**Mejoras sugeridas:**
- Crear un catálogo maestro rígido de Patentes y Cuentas SAP para que sea 100% autocompletado y evitar errores de tipeo.

---

### Resumen General (Torre de Control)
**Ruta:** `/torre-control/dashboard-cyr`
**Área usuaria:** Torre de Control
**Rol autorizado:** Admin, Torre Control
**Objetivo:** Pantalla principal de trabajo para monitorear metas y cargar los avances de las brigadas a medida que transcurre el día.

**Qué ve el usuario:**
Tres componentes:
1. Panel de "Resumen General" con KPIs globales.
2. "Programación diaria por zona": Tarjetas por zona mostrando Carga, Cortes Programados, Completados o Pendientes.
3. Listado de Brigadas (Acordeón): Tabla editable para anotar la ejecución real de cada brigada.

**Botones y acciones:**
| Botón / Acción | Qué hace | Impacto |
| -------------- | -------- | ------- |
| "Guardar Cambios" | Envía los valores editados a la base de datos. | Actualiza KPIs y cambia el estado visual de progreso. |
| "Guardar Todo (N)" | Guarda ediciones masivas en el listado de brigadas. | Actualiza los datos de ejecución real (cortes, reconexiones ejecutadas). |

**Campos editables:**
| Campo | Quién lo edita | Para qué sirve | Validación |
| ----- | -------------- | -------------- | ---------- |
| Asign. Carga (Zona) | Torre de Control / Supervisor | Ajustar la carga final asignada | Número entero. |
| REC. EJEC / Corte Poste / Corte Empalme | Torre de Control | Anotar avance físico de la brigada | Valores numéricos sobre los ejecutados. |
| Estado / Observación | Torre de Control | Marcar inactividad o contingencia | Selección de lista desplegable. |

**Datos calculados:**
| KPI / Métrica | Fórmula o lógica | Fuente |
| ------------- | ---------------- | ------ |
| Total Actividades | Reconexiones Ejec. + Corte Poste + Corte Empalme | Inputs manuales en la tabla. |
| Promedios por Brigada | Total ejecutado / Cantidad de Brigadas | Base de datos (vía `Resumen Zona Service`). |

**Endpoints utilizados:**
| Endpoint | Uso |
| -------- | --- |
| `/api/resumen-zona/` | Trae todos los KPIs calculados por el backend. |
| `/api/programacion-zona/` | Guarda ajustes globales de la zona. |

**Dependencias con otras pantallas:**
Se alimenta de Bitácora Supervisor. Alimenta el Reporte Gerencial.

**Problemas detectados / Riesgos:**
- Riesgo: La edición de celdas en la tabla puede requerir doble clic. Si el operador no guarda los cambios, se pierde la actualización del avance.

**Mejoras sugeridas:**
- Implementar guardado automático (Auto-save) de celdas al perder el foco (onBlur) para mayor velocidad de Torre de Control.

---

### Reporte Gerencial
**Ruta:** `/reporte-gerencial`
**Área usuaria:** Gerencia
**Rol autorizado:** Admin, Gerencia
**Objetivo:** Vista analítica ejecutiva del estado de la operación.

**Qué ve el usuario:**
Tarjetas con números grandes de KPIs estratégicos, un gráfico de barras horizontales mostrando el cumplimiento de meta por zona y una tabla resumen.

**Datos calculados:**
| KPI / Métrica | Fórmula o lógica | Fuente |
| ------------- | ---------------- | ------ |
| Cumpl. % Prom. según Meta | Total Cortes / (Brigadas Operativas * Meta Diaria por brigada) | Calculado en frontend. |
| Cumpl. Corte s/Carga | Total Cortes / Asignación Carga General | Calculado en frontend. |

**Problemas detectados / Riesgos:**
- Esta vista realiza cálculos matemáticos en el frontend (`useReporteGerencial.ts`). Si las reglas de negocio cambian en el backend, hay que mantener ambas lógicas sincronizadas.

**Mejoras sugeridas:**
- Hacer que el Reporte Gerencial consuma directamente el endpoint de Resumen Zona del backend para garantizar 100% consistencia de fórmulas.

---

## 5. Flujo operativo diario

El funcionamiento sistémico asume el siguiente ciclo de vida:

1. **Torre de Control (Opcional):** Usa la pantalla "Inicio del día" para pre-cargar la base operativa clonando el día de ayer.
2. **Supervisor inicia sesión:** Revisa la fecha de hoy.
3. **Supervisor ingresa Bitácora:** Valida o agrega brigadas manuales, ajusta "Cortes Prog." y "Asignación Carga" inicial de sus zonas.
4. **Torre de Control comienza seguimiento:** Accede a "Resumen General". Ve las brigadas listadas por el supervisor.
5. **Carga de Ejecutados:** Torre de Control edita las columnas de "Rec. Ejec.", "Corte Empalme" y "Corte Poste" de cada brigada según reciben avisos de terreno.
6. **Validación Visual:** Los bordes de las tarjetas de zonas cambian de Gris (Pendiente) a Azul Primario (Completado) según los KPIs.
7. **Consumo Gerencial:** El gerente accede a `/reporte-gerencial` y visualiza la rentabilidad y efectividad (Cumplimiento s/ Meta) en vivo.

---

## 6. Reglas de negocio importantes

- **Origen de datos:** "Corte Programado" y "Reconexiones Programadas" nacen en la Bitácora del Supervisor. 
- **Edición manual:** Los valores ejecutados (REC. EJEC., CORTES POSTE/EMPALME) son de uso manual exclusivo de Torre de Control, no del supervisor.
- **Diferenciación CF/PXQ:** Se separan las metas. La brigada "CF" solo está disponible conceptualmente para Coquimbo y Talca.
- **Asignación Carga Editable:** La asignación de carga total no es una sumatoria estricta, sino un parámetro editable por Zona en "Programación diaria por zona" para dar flexibilidad a Torre de Control.
- **Manejo de Fechas:** Toda la aplicación está gobernada por el selector de "Fecha Operacional" superior. La data es estricta por día. No mezclar datos programados con ejecutados de días distintos.

---

## 7. Diccionario de campos

| Campo | Significado | Quién lo ingresa | Dónde se usa |
| ----- | ----------- | ---------------- | ------------ |
| Zona | Agrupación geográfica principal | Autocalculada según comuna | Filtros, KPIs, Reportes |
| Comuna | Ubicación específica | Supervisor | Bitácora Supervisor |
| Usuario SAP | Identificador del trabajador en SAP | Supervisor | Bitácora, Identificación |
| Cuenta | Nombre del operario | Supervisor | Bitácora |
| Patente | Matrícula del vehículo | Supervisor | Identificación de la brigada |
| Tipo Brigada | Tipo de contrato (Pago por corte PXQ o Cuota Fija CF) | Supervisor | Cálculos de Metas |
| Corte Programado | Cantidad de cortes que debe hacer la zona/brigada | Supervisor | Denominador de eficiencia |
| Reconexiones Programadas | Cantidad de rec. asignadas | Supervisor | Metas base |
| Asignación Carga | Total de trabajo en la bandeja de la zona | Supervisor / TC | KPI Cumplimiento Corte |
| REC. EJEC. | Reconexiones logradas físicas | Torre Control | Eficiencia de la brigada |
| Corte Empalme / Poste | Tipos de cortes físicos logrados | Torre Control | Producción bruta de cortes |
| Hora GPS / Primer Corte / Último | Marcas de tiempo de actividad | Torre Control / Sistema | Supervisión de jornada |
| Estado | Operativa o Inactiva | Torre Control | Descuenta de base meta si inactiva |

---

## 8. Matriz de brechas y mejoras

| Prioridad | Pantalla | Problema detectado | Impacto | Recomendación |
| --------- | -------- | ------------------ | ------- | ------------- |
| Alta | Bitácora Supervisor | Faltan validaciones estrictas entre SAP y Nombre. | Errores de tipeo manchan la BD. | Implementar un maestro de SAP/Cuentas con autocompletado en frontend. |
| Media | Reporte Gerencial | Lógica matemática duplicada en Frontend (React). | Desfase si se cambia la fórmula backend. | Conectar la vista Gerencial a los endpoints de `resumen_zona` del backend. |
| Media | Resumen General | Torre Control debe guardar cambios de celda manualmente con un botón. | Pérdida de tiempo en UX. | Habilitar `Auto-Save` (onBlur) sobre la grilla de Excel. |
| Baja | Configuración | No existe una pantalla robusta terminada de Parámetros | No se pueden ajustar variables. | Construir UI para editar `ControlParametrosGenerales` y `Meta Diaria`. |

---

## 9. Checklist de validación para reunión

*(Para revisar con el gerente y las áreas operativas)*

- [ ] ¿El flujo diario (Supervisor carga -> TC actualiza) corresponde exactamente a la operación real?
- [ ] ¿Los supervisores ven solo lo necesario y no hay campos que los confundan?
- [ ] ¿Torre de Control puede completar datos cómodamente en las tablas estilo Excel?
- [ ] ¿Los KPI (`Cumpl. % Prom. según Meta` y `Cumpl. Corte s/Carga`) se calculan con los denominadores aprobados por gerencia?
- [ ] ¿Los campos programados (del supervisor) y ejecutados (de TC) están correctamente separados conceptualmente?
- [ ] ¿Faltan botones de exportar a Excel / PDF en el Reporte Gerencial?
- [ ] ¿Están claros los roles y permisos o falta un nivel intermedio de "Aprobador"?
- [ ] ¿Qué otra información necesita gerencia que aún no aparece graficada?
