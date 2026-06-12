Necesito que analices la aplicación completa y generes un entregable/documento funcional para presentar al gerente y a las áreas que usarán el sistema.

Importante: esta tarea es solo de análisis y documentación. No modifiques código, no refactorices, no cambies archivos de lógica ni diseño. Solo revisa y explica.

Objetivo del entregable:

Explicar de forma clara cómo funciona la app, pantalla por pantalla, botón por botón y funcionalidad por funcionalidad, para que podamos validar con gerencia y con cada área usuaria qué está correcto, qué falta y qué debemos corregir.

Áreas que deben quedar explicadas:

1. Gerencia
2. Torre de Control CyR
3. Supervisores
4. Superadmin
5. Usuarios futuros si aplica

Debes revisar:

- Rutas existentes de la app
- Sidebar / navegación
- Login y roles
- Pantallas disponibles por rol
- Bitácora Supervisor
- Resumen General / Programación diaria por zona
- Listado de brigadas
- Resumen por Zona
- Reporte Gerencial si existe
- Configuración / Parámetros si existe
- Cualquier otra vista disponible actualmente

Para cada pantalla debes documentar:

1. Nombre de la pantalla
2. Ruta URL
3. Qué área la usa
4. Qué rol puede acceder
5. Objetivo de la pantalla
6. Qué datos muestra
7. De dónde vienen los datos
8. Qué datos permite ingresar o editar
9. Qué botones tiene
10. Qué hace cada botón
11. Qué validaciones existen
12. Qué KPI muestra
13. Cómo se calculan los KPI
14. Qué endpoint usa si aplica
15. Qué impacto tiene en otras pantallas
16. Qué problemas o riesgos detectas
17. Qué mejoras recomiendas

Formato esperado del documento:

# Manual funcional y levantamiento de brechas - Torre de Control CyR

## 1. Resumen ejecutivo

Explicar en lenguaje simple qué hace la plataforma, qué problema resuelve y qué áreas participan.

## 2. Roles del sistema

Crear una tabla con:

| Rol | Usuario ejemplo | Acceso | Restricciones |
| --- | --------------- | ------ | ------------- |

Incluir al menos:

- Superadmin
- Supervisor
- Torre de Control si aplica

## 3. Mapa de navegación

Crear una tabla con:

| Pantalla | Ruta | Rol con acceso | Objetivo |
| -------- | ---- | -------------- | -------- |

## 4. Explicación pantalla por pantalla

Para cada pantalla usar esta estructura:

### Nombre de pantalla

**Ruta:**
**Área usuaria:**
**Rol autorizado:**
**Objetivo:**

**Qué ve el usuario:**
Explicar los paneles, tablas, filtros, formularios y KPI.

**Botones y acciones:**

| Botón / Acción | Qué hace | Impacto |
| -------------- | -------- | ------- |

**Campos editables:**

| Campo | Quién lo edita | Para qué sirve | Validación |
| ----- | -------------- | -------------- | ---------- |

**Datos calculados:**

| KPI / Métrica | Fórmula o lógica | Fuente |
| ------------- | ---------------- | ------ |

**Endpoints utilizados:**

| Endpoint | Uso |
| -------- | --- |

**Dependencias con otras pantallas:**
Explicar si los datos alimentan otra vista.

**Problemas detectados / Riesgos:**
Listar errores, inconsistencias o puntos débiles.

**Mejoras sugeridas:**
Listar mejoras simples y priorizadas.

## 5. Flujo operativo diario

Explicar paso a paso el flujo real del día:

1. Supervisor inicia sesión.
2. Ingresa bitácora del día.
3. Agrega brigadas.
4. Asigna cortes programados.
5. Asigna reconexiones programadas.
6. Ajusta asignación de carga por zona.
7. Actualiza bitácora.
8. Torre de Control revisa Resumen General.
9. Torre de Control completa datos ejecutados.
10. Gerencia revisa indicadores.

## 6. Reglas de negocio importantes

Documentar reglas como:

- Corte programado viene desde Bitácora Supervisor.
- Reconexiones programadas vienen desde Bitácora Supervisor.
- REC. EJEC. es manual de Torre de Control.
- Asignación de carga es editable por zona.
- Supervisor solo ve sus zonas asignadas.
- Superadmin ve todo.
- Los datos deben respetar la fecha seleccionada.
- No mezclar datos programados con datos ejecutados.

## 7. Diccionario de campos

Crear una tabla:

| Campo | Significado | Quién lo ingresa | Dónde se usa |
| ----- | ----------- | ---------------- | ------------ |

Incluir:

- Zona
- Comuna
- SAP
- Usuario / Cuenta
- Patente
- Tipo brigada
- Corte programado
- Reconexiones programadas
- Asignación carga
- REC. EJEC.
- Hora GPS
- Primer corte
- Último corte
- Estado
- Observación

## 8. Matriz de brechas y mejoras

Crear una tabla final:

| Prioridad | Pantalla | Problema detectado | Impacto | Recomendación |
| --------- | -------- | ------------------ | ------- | ------------- |

Prioridades:

- Alta
- Media
- Baja

## 9. Checklist de validación para reunión

Crear checklist para revisar con el gerente y las áreas:

- ¿El flujo diario corresponde a la operación real?
- ¿Los supervisores ven solo lo necesario?
- ¿Torre de Control puede completar datos cómodamente?
- ¿Los KPI muestran lo esperado?
- ¿Los campos programados y ejecutados están correctamente separados?
- ¿Faltan botones o acciones?
- ¿Faltan permisos?
- ¿Faltan reportes?
- ¿Qué información necesita gerencia que aún no aparece?

Requisitos importantes:

- Usar lenguaje claro, no demasiado técnico.
- Explicar como si el documento lo fueran a leer gerentes, supervisores y Torre de Control.
- Cuando haya explicación técnica, dejarla en una sección separada.
- No inventar funcionalidades que no existen.
- Si algo no está implementado, marcarlo como “pendiente” o “recomendación”.
- Si algo no está claro en el código, indicarlo como “requiere validación”.
- Incluir ejemplos concretos del flujo CyR.
- No modificar el código.

Resultado esperado:

Un documento completo en formato Markdown llamado:

`DOCUMENTO_FUNCIONAL_TORRE_CONTROL_CYR.md`

Este documento debe servir como entregable para presentar el sistema, explicar cómo se usa y detectar qué debemos arreglar antes de pasarlo a producción.
