# Skill — Fase 3 pequeña: Resumen Bitácora Supervisor por Zona en Backend

Actúa como backend senior, frontend engineer y QA.

Modo ahorro de créditos y ejecución controlada.

No analices todo el proyecto.
No hagas refactor masivo.
No hagas merge.
No toques Reporte Gerencial, Resumen General global, Resumen por Zona global, Medición ni Empalme.
No cambies reglas globales PXQ/CF.
No modifiques BD salvo que sea estrictamente necesario.
No elimines lógica funcionando hasta validar reemplazo.

## Objetivo

Mover al backend el cálculo oficial del resumen de Bitácora Supervisor por zona.

El frontend puede seguir mostrando la tabla editable, pero el resumen oficial ya no debe calcularse en React con `calcularResumenPorZona(...)`.

## Rama

Antes de modificar:

```bash
git status
git checkout -b feature/backend-resumen-bitacora-zona
git branch
```

Si la rama ya existe, usarla.

## Alcance exacto

Implementar solo una vista previa/resumen de Bitácora Supervisor por zona.

Debe calcular:

- total_brigadas
- corte_programado_total
- reconexiones_programadas_total
- total_en_bandeja por zona si viene informado
- desglose por zona
- desglose por tipo_brigada PXQ/CF
- errores de validación
- advertencias por comuna sin zona

## Endpoint requerido

Crear endpoint:

```txt
POST /api/supervisores/{supervisor_id}/bitacora/resumen-preview
```

Este endpoint solo calcula resumen.
No guarda datos.
No crea brigadas.
No actualiza programación.

## Request esperado

```json
{
  "fecha_operacional": "2026-06-18",
  "filas": [
    {
      "codigo_sap": "P003372",
      "cuenta": "Jose Bravo",
      "patente": "VSXK79",
      "brigada": "Brigada 1",
      "pareja": "Nombre pareja",
      "comuna": "Concepcion",
      "tipo_brigada": "PXQ",
      "carga": 10,
      "reconexiones": 2,
      "estado_brigada": "Operativa",
      "observacion": ""
    }
  ],
  "total_en_bandeja_por_zona": {
    "Concepción": 100,
    "Chillán": 40,
    "Los Ángeles": 30
  }
}
```

## Response esperado

```json
{
  "fecha_operacional": "2026-06-18",
  "supervisor_id": 1,
  "total_brigadas": 10,
  "total_corte_programado": 120,
  "total_reconexiones_programadas": 15,
  "zonas": [
    {
      "zona": "Concepción",
      "tipo_brigada": "PXQ",
      "total_brigadas": 6,
      "corte_programado": 80,
      "reconexiones_programadas": 10,
      "total_en_bandeja": 100
    }
  ],
  "errores": [],
  "advertencias": []
}
```

## Reglas backend

Para cada fila:

- `carga` = corte_programado
- `reconexiones` = reconexiones_programadas
- resolver `comuna` → `zona` desde `control_supervisor_comunas_zonas`
- siempre filtrar por `supervisor_id`
- validar que el SAP pertenezca al supervisor
- validar que la comuna pertenezca al supervisor
- validar que el tipo_brigada sea permitido
- carga y reconexiones deben ser >= 0
- si comuna no tiene zona, devolver error o advertencia
- si SAP pertenece a otro supervisor, devolver error
- no incluir filas inválidas en el resumen válido

## Archivos permitidos

Revisar/modificar solo si corresponde:

```txt
backend/app/api/routes/supervisores.py
backend/app/services/supervisor_bitacora_service.py
backend/app/repositories/supervisor_repository.py
backend/app/schemas/supervisor_bitacora.py
frontend/src/api/supervisores.api.ts
frontend/src/components/supervisor/SupervisorBitacoraView.tsx
frontend/src/components/supervisor/SupervisorBitacoraLogic.ts
```

Usar nombres reales si difieren.

## Frontend

Actualizar Bitácora Supervisor para usar el endpoint nuevo.

Reglas:

- crear función API `getResumenBitacoraPreview` o similar
- al presionar “Validar bitácora”, llamar al backend
- antes de “Guardar bitácora de hoy”, validar con backend
- no llamar backend en cada tecla
- mantener UI actual
- mostrar errores/advertencias devueltos por backend
- no volver a usar `getAllUsuariosSap()`
- dejar la lógica local solo como fallback temporal si es necesario

## Pruebas obligatorias

Validar manualmente:

1. Juan Muñoz:

- cargar brigadas frecuentes
- modificar carga/reconexiones
- validar bitácora
- resumen solo debe mostrar Concepción, Chillán y Los Ángeles
- no debe aparecer Talca

2. Jose Masso / Talca:

- cargar brigadas frecuentes
- validar bitácora
- resumen solo debe mostrar Talca
- debe soportar PXQ y CF

3. Error controlado:

- poner comuna inválida
- backend debe devolver error/advertencia
- frontend debe mostrarlo sin romper pantalla

4. Seguridad:

- enviar SAP de otro supervisor
- backend debe marcar error
- no debe incluirlo en resumen válido

## Validaciones técnicas

Ejecutar:

```bash
git status
npm run build
```

Si existe:

```bash
pytest
```

## Entrega final

Entregar solo:

- rama activa
- archivos modificados
- endpoint creado
- request/response final
- comandos ejecutados
- resultado de build
- pruebas realizadas o sugeridas
- problemas encontrados
- si está listo para commit o no

No mostrar código completo salvo archivo nuevo.
No entregar explicación larga.
No hacer merge.
