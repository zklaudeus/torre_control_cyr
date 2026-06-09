# Endpoints de Brigadas del día - Fase 5

Los endpoints del servicio Brigadas del día (control_brigadas_diario) se han habilitado en `/api/brigadas-dia/`.

## 1. `GET /api/brigadas-dia?fecha=YYYY-MM-DD`
**Objetivo:** Obtener todas las brigadas de una fecha específica.
**Comportamiento:** Retorna un arreglo JSON ordenado por zona y nombre de usuario. Si no hay elementos, entrega un `[]` vacío.

## 2. `POST /api/brigadas-dia/`
**Objetivo:** Insertar un nuevo contingente.
**Comportamiento:** Comprueba la fecha, el tipo_brigada (`PXQ`, `CF` o `Convenio`), y su estado (`Operativa` o `Inactiva`). Si la brigada es Inactiva, asegura que tenga una observación antes de guardar. 

## 3. `PUT /api/brigadas-dia/{id}`
**Objetivo:** Alterar los datos de una brigada existente (por ID).
**Comportamiento:** Emplea las mismas reglas que la inserción, retornando un error `404` controlado en caso de buscar una brigada inexistente.

## 4. `DELETE /api/brigadas-dia/{id}`
**Objetivo:** Exterminar un ingreso erróneo de la BD.
**Comportamiento:** Borra el registro y entrega un status OK, o error `404`.

## 5. `GET /api/brigadas-dia/resumen?fecha=YYYY-MM-DD`
**Objetivo:** Elaborar un estado general basado en conteos simples por cada zona.
**Comportamiento:** Proporciona un desglose total sumando las clasificaciones (cuantas operativas, inoperativas y clasificaciones de contrato), ideal para inyectar al dashboard visual del UI.
