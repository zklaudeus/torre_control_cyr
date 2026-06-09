# Endpoints de Programación de Zona - Fase 4

Se han añadido los siguientes endpoints en FastAPI para gestionar las zonas y su programación.

## 1. `GET /api/parametros/zonas`
**Objetivo:** Retornar todas las zonas operacionales activas configuradas.
**Respuesta:** Una lista de zonas con su id, nombre, brigadas contratadas y estado `activo`.

## 2. `GET /api/programacion-zona/?fecha={fecha_operacional}`
**Objetivo:** Obtener la programación guardada para la fecha solicitada.
**Comportamiento:**
- Carga las zonas activas y las cruza con los registros de la base de datos.
- Si una zona ya tiene programación, retorna esos valores.
- Si una zona no tiene programación, retorna un objeto virtual con id nulo y valores numéricos en 0.

## 3. `POST /api/programacion-zona/bulk`
**Objetivo:** Guardar masivamente o actualizar la programación de varias zonas a la vez para una fecha específica.
**Comportamiento:**
- Recibe un objeto que contiene `fecha_operacional` y una lista de `items` (zonas con sus 3 variables: reconexiones, carga y corte).
- Ejecuta una inserción o actualización bajo la lógica de "upsert" considerando que solo debe existir un registro por dupla (fecha, zona).

## 4. `PUT /api/programacion-zona/{id}`
**Objetivo:** Modificación individual (soporte opcional, habilitado pero delegado como uso en segundo plano frente al uso del /bulk por ahora).
