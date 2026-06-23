[ANÁLISIS]

Objetivo: diseñar el modelo mínimo de base de datos para el motor de Productividad y Rendimiento Técnico.

Contexto:
Ya está actualizado el documento funcional de Rendimiento Técnico.
Antes de crear endpoints o conectar frontend, necesitamos definir las tablas mínimas, campos, tipos de datos, relaciones, restricciones e índices.

El modelo debe soportar:

- cuenta SAP como unidad principal
- productividad diaria
- metas PXQ/CF
- cortes productivos
- visitas fallidas como análisis separado
- flujo de apertura/cierre de Bitácora
- ausencia justificada/manual
- fases 1, 2 y 3
- advertencias de Torre Control
- historial auditable de cambios de fase
- recálculos idempotentes

Archivos de referencia:

- contexto.md
- diseno_tecnico_rendimiento.md
- docs/reglas_productividad_rendimiento.md si existe

Alcance:
Solo análisis y diseño.
No crear migraciones.
No crear endpoints.
No modificar modelos SQLAlchemy todavía.
No modificar frontend.
No tocar datos reales.
No ejecutar SQL.

Restricciones:

- No tocar backend.
- No tocar frontend.
- No tocar base de datos.
- No crear tablas todavía.
- No crear endpoint de productividad todavía.
- No cambiar login.
- No cambiar permisos actuales.
- No hacer refactor.
- No hacer merge.

Reglas de negocio obligatorias:

1. Productividad:

- La productividad se calcula solo con cortes productivos.
- cortes_productivos = corte_en_poste + corte_en_empalme + corte_fuera_de_rango.
- Las visitas fallidas NO se descuentan.
- Las visitas fallidas NO afectan categoría, estado ni fase productiva.

2. Metas:

- PXQ: meta diaria 25 cortes.
- CF: meta diaria 6 cortes.

3. Estados PXQ:

- 0 a 12 cortes = Crítico.
- 13 a 24 cortes = En recuperación.
- 25 a 29 cortes = Estable.
- 30 o más cortes = Alto desempeño.

4. Estados CF:

- 0 a 2 cortes = Crítico.
- 3 a 5 cortes = En recuperación.
- 6 o más cortes = Estable / Alto desempeño según regla de racha definida.

5. Fallidas:
   Deben almacenarse y analizarse para:

- total diario por usuario SAP
- variación absoluta vs día anterior
- variación porcentual vs día anterior
- acumulado 7 días
- acumulado 14 días
- acumulado mensual
- causa de fallida
- análisis por supervisor, zona y gerencia

No deben usarse para:

- categoría productiva
- racha bajo 50%
- racha de cumplimiento
- activación automática de fase

6. Ausencias:
   Una ausencia:

- es día no evaluable
- no suma productividad cero
- no rompe racha
- no suspende racha
- no reinicia racha
- debe permitir causa manual

Causas de ausencia:

- Permiso
- Licencia médica
- Vacaciones
- Ausencia de maestro
- No reportado
- Otra causa

7. Bitácora:

- Apertura de bitácora: la realiza el supervisor al asignar usuarios SAP, cargas, zonas y carga en bandeja.
- Cierre de bitácora: lo realiza Torre Control.
- La presencia/ausencia solo se considera definitiva después del cierre de Torre Control.
- Debe existir trazabilidad de apertura, cierre, reapertura y motivo.

8. Fases:

- Fase 1: estado base.
- Fase 2: puede activarse por productividad crítica recurrente.
- Fase 3: se activa por advertencias registradas por Torre Control.
- Si un técnico estando en Fase 2 acumula 3 advertencias de Torre Control, pasa a Fase 3.
- Fase 3 no se activa automáticamente por fallidas.
- La salida o bajada de fase requiere aprobación de Torre Control y motivo obligatorio.

9. Auditoría:
   Debe quedar historial de:

- cambios de estado
- cambios de fase
- advertencias
- usuario actor
- motivo
- fecha/hora
- regla aplicada
- snapshot de datos usados para el cálculo

Diseñar tablas mínimas sugeridas:

1. tecnicos
2. bitacoras_supervisor_diarias
3. productividad_reglas
4. productividad_diaria
5. rendimiento_tecnico_actual
6. rendimiento_tecnico_historial
7. rendimiento_tecnico_advertencias
8. rendimiento_tecnico_ausencias
9. rendimiento_tecnico_fallidas_resumen o detalle de fallidas si aplica
10. productividad_recalculos si aplica

Para cada tabla entregar:

- nombre de tabla
- propósito
- columnas
- tipo de dato PostgreSQL
- null / not null
- claves primarias
- claves foráneas
- restricciones únicas
- índices recomendados
- regla de negocio que soporta

También entregar:

1. Diagrama textual de relaciones.
2. Flujo de datos:
   - apertura de bitácora
   - carga supervisor
   - cierre Torre Control
   - cálculo productividad
   - registro ausencia
   - registro fallidas
   - activación fase 2
   - advertencias fase 3

3. Riesgos del modelo.
4. Decisiones pendientes.
5. Recomendación final de qué tablas crear primero.
6. Qué NO implementar todavía.
7. Siguiente paso recomendado después de aprobar el modelo.

Salida esperada:

- documento de diseño de modelo de datos
- sin código aplicado
- sin SQL ejecutado
- sin migraciones creadas
- incluir propuesta de migraciones aditivas futuras, pero solo como diseño

Fin del prompt
