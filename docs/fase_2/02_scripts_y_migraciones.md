# Scripts y Migraciones - Fase 2

Como Alembic no estaba previamente inicializado en la Fase 1 de la beta, se optó por la "Opción B", creando un script SQL seguro para crear la base de datos sin usar comandos destructivos.

## Script: `backend/sql/001_fase_2_base_datos_minima.sql`

Este script contiene toda la lógica DDl para:
- Crear las 6 tablas (`CREATE TABLE IF NOT EXISTS`)
- Establecer las Foreign Keys lógicas (restricciones UNIQUE y PRIMARY KEYS)
- Construir los índices en los campos principales (`CREATE INDEX IF NOT EXISTS`)
- Incorporar los seeds con instrucciones no destructivas (`ON CONFLICT DO NOTHING` o `WHERE NOT EXISTS`)

Este script se puede correr directamente contra PostgreSQL / Neon para desplegar la estructura de la base de datos de manera idempotente.

Además, se generaron los modelos de SQLAlchemy equivalentes en `backend/app/models/cyr_models.py` para estar listos en fases posteriores.
