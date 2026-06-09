# Endpoints de Reportes - Fase 3

Se han expuesto los siguientes endpoints RESTFul en FastAPI para el control de los reportes diarios bajo el prefijo `/api/reportes`.

## 1. `POST /api/reportes/`
**Objetivo:** Crear un nuevo reporte o devolver el existente para la fecha operacional indicada.
**Payload:**
```json
{
  "fecha_operacional": "YYYY-MM-DD"
}
```
**Comportamiento:** Si no existe un reporte para esa fecha, crea uno con estado `borrador`. Si existe, lo devuelve evitando duplicaciones de registro en base de datos.

## 2. `GET /api/reportes/`
**Objetivo:** Listar los reportes diarios existentes.
**Comportamiento:** Devuelve una lista ordenada descendentemente por fecha operacional (con un límite predeterminado).

## 3. `GET /api/reportes/{fecha_operacional}`
**Objetivo:** Obtener el detalle de un reporte buscando por su fecha operacional.
**Comportamiento:** Si existe, retorna el modelo del reporte. Si no, retorna un HTTP 404 (Reporte no encontrado). No crea reportes nuevos.
