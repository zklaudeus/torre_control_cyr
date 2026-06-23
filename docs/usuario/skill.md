[ANÁLISIS]

Objetivo: preparar implementación segura de reglas de negocio para el módulo Rendimiento Técnico sin romper componentes visuales existentes.

Contexto:
La página `rendimiento_tecnico` ya tiene componentes visuales:

- Tarjeta Usuario
- KPIs
- Semáforos
- Fase de Seguimiento
- Cursos Realizados
- Hallazgos
- Recomendación del Supervisor
- Selector de técnico

Ahora se deben implementar reglas de negocio de forma gradual.
Las reglas no deben quedar duplicadas dentro de cada componente visual.

Alcance:

- frontend/src/modules/rendimiento_tecnico/\*\*
- frontend/src/components/rendimiento_tecnico/\*\* si existe

Restricciones:

- Solo análisis.
- No modificar archivos.
- No tocar backend.
- No tocar login.
- No tocar permisos.
- No tocar Reporte Gerencial.
- No tocar Resumen General.
- No tocar Resumen por Zona.
- No tocar Bitácora Supervisor.
- No conectar API todavía.
- No hacer refactor masivo.
- No hacer merge.

Analizar:

1. Qué componentes existen actualmente en `rendimiento_tecnico`.
2. Dónde están los datos mock.
3. Qué componente muestra KPIs.
4. Qué componente muestra semáforos.
5. Qué componente muestra fase.
6. Qué componente muestra hallazgos.
7. Dónde conviene crear:
   - types/rendimientoTecnico.types.ts
   - rules/rendimientoTecnico.rules.ts
   - data/rendimientoTecnico.mock.ts

Proponer:

1. Archivos exactos a crear.
2. Archivos exactos a modificar.
3. Orden seguro de implementación.
4. Primera regla a implementar: Productividad.
5. Cómo evitar romper componentes visuales.
6. Cómo mantener semáforos manuales pero con estado sugerido.

Salida esperada:

- lista de hallazgos
- estructura recomendada de archivos
- orden de implementación
- riesgos detectados
- siguiente prompt de ejecución sugerido

Fin del prompt
