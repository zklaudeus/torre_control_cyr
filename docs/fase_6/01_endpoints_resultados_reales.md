# Endpoints de Resultados Reales por Zona - Fase 6

Los endpoints se alojan bajo el router `/api/resultados-reales-zona`.

## 1. `GET /api/resultados-reales-zona?fecha=YYYY-MM-DD`
**Objetivo:** Retornar los resultados ejecutados reales ingresados manualmente para la fecha requerida.
**Comportamiento:** 
- Descarga el catálogo de zonas activas del día.
- Cruza los datos con lo almacenado en `control_resultados_reales_zona`.
- Rellena con valores en `0` toda zona que aún no haya sido gestionada en ese día.

## 2. `POST /api/resultados-reales-zona/bulk`
**Objetivo:** Persistir en bloque todos los campos editados de la tabla del frontend.
**Comportamiento:** 
- Recibe un objeto que contiene `fecha_operacional` y una lista `items` con los resultados de todas las zonas.
- Ejecuta una operación idempotente ("Upsert"): si el registro `(fecha, zona)` existe lo actualiza, de lo contrario lo crea.

## 3. `PUT /api/resultados-reales-zona/{id}`
**Objetivo:** Actualización granular de un ID ya consolidado.
**Comportamiento:** Endpoint de apoyo en caso de desear actualizar un resultado individual (p.e. en alguna tabla de mantenimiento). Implementado opcionalmente pero su uso principal delega en el bulk de la UI.
