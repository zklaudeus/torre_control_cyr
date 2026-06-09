# SKILL.md — Fase 6: Resultados reales temporales por zona

## 1. Objetivo de la fase

Crear el módulo de **Resultados reales temporales por zona** para la beta funcional Torre de Control CYR EISESA.

Esta fase debe permitir que Torre de Control cargue manualmente, por fecha y zona, los resultados reales de la operación mientras todavía no existe integración automática con Neon o la app actual.

Estos datos serán usados después por el **Resumen por Zona automático**.

La Fase 6 corresponde al flujo:

```text
Fecha → Programación por zona → Brigadas del día → Resultados reales → Resumen automático → Exportar Excel
```

En esta fase solo se implementa:

```text
Resultados reales temporales por zona
```

No se debe crear todavía el Resumen por Zona final ni exportación Excel.

---

## 2. Lecturas obligatorias antes de comenzar

Antes de implementar, revisar:

```text
docs/00_contexto_maestro_eisesa.md
docs/fase_0/
docs/fase_1/
docs/fase_2/
docs/fase_3/
docs/fase_4/
docs/fase_5/
docs/fase_6/SKILL.md
```

Respetar especialmente:

- La beta es solo para Torre de Control.
- No hay login ni roles todavía.
- La tabla `control_resultados_reales_zona` ya debe existir desde Fase 2.
- Las zonas vienen desde `control_parametros_zona`.
- Esta fase carga datos temporales.
- Más adelante estos datos podrán venir automáticamente desde Neon.
- No modificar tablas históricas existentes.

---

## 3. Alcance permitido

En esta fase está permitido:

- Crear endpoints para resultados reales por zona.
- Crear schemas Pydantic.
- Crear repositorio o servicio para `control_resultados_reales_zona`.
- Leer zonas activas desde `control_parametros_zona`.
- Crear pantalla React para resultados reales.
- Mostrar tabla editable por zona.
- Guardar varias zonas de una vez.
- Cargar resultados existentes por fecha.
- Validar campos numéricos.
- Documentar el resultado de la fase.

---

## 4. Alcance prohibido

En esta fase no está permitido:

- Crear Resumen por Zona automático final.
- Crear exportación Excel.
- Crear dashboard.
- Crear login.
- Crear usuarios o roles.
- Crear integración automática con Neon.
- Modificar `reporte_historico`.
- Modificar `fact_operacion_detalle`.
- Modificar vistas existentes.
- Implementar bonificación.
- Cambiar módulos ya terminados sin necesidad.

---

## 5. Tabla usada en esta fase

Tabla principal:

```text
control_resultados_reales_zona
```

Campos esperados:

```text
id
fecha_operacional
zona
total_reconexiones_ejecutadas
total_cortes
corte_en_poste
corte_en_empalme
visita_fallida
primer_corte
ultimo_corte
acum_09
acum_10
acum_11
acum_12
acum_13
acum_14
created_at
updated_at
```

Regla importante:

```text
UNIQUE(fecha_operacional, zona)
```

Esto evita duplicar resultados reales para una misma zona y fecha.

---

## 6. Campos mínimos para la beta

La pantalla debe enfocarse primero en estos campos:

```text
Zona
Total reconexiones ejecutadas
Total Cortes
Corte en poste
Corte en empalme
Visita Fallida
```

Estos campos son suficientes para alimentar el Resumen por Zona.

Los siguientes campos pueden quedar disponibles pero no son prioridad visual:

```text
Primer corte
Último corte
Acum_09
Acum_10
Acum_11
Acum_12
Acum_13
Acum_14
```

---

## 7. Backend esperado

Estructura sugerida:

```text
backend/
  app/
    models/
      resultado_real_zona.py
    schemas/
      resultado_real_zona.py
    repositories/
      resultado_real_zona_repository.py
    services/
      resultado_real_zona_service.py
    api/
      routes/
        resultados_reales_zona.py
```

Si el proyecto ya usa otra estructura, adaptarse sin romper lo existente.

---

## 8. Endpoints requeridos

Crear estos endpoints:

```text
GET  /api/resultados-reales-zona?fecha=YYYY-MM-DD
POST /api/resultados-reales-zona/bulk
PUT  /api/resultados-reales-zona/{id}
```

---

## 9. Comportamiento de endpoints

### 9.1. `GET /api/resultados-reales-zona?fecha=YYYY-MM-DD`

Objetivo:

Obtener resultados reales temporales para una fecha.

Comportamiento esperado:

- Si existen registros para la fecha, devolverlos.
- Si no existen, devolver zonas activas con valores en cero.
- No crear registros automáticamente solo por consultar.
- Mostrar todas las zonas activas aunque no tengan datos guardados.

Respuesta esperada:

```json
[
  {
    "id": null,
    "fecha_operacional": "2026-06-08",
    "zona": "Coquimbo",
    "total_reconexiones_ejecutadas": 0,
    "total_cortes": 0,
    "corte_en_poste": 0,
    "corte_en_empalme": 0,
    "visita_fallida": 0
  }
]
```

---

### 9.2. `POST /api/resultados-reales-zona/bulk`

Objetivo:

Guardar o actualizar varias zonas de una vez.

Payload esperado:

```json
{
  "fecha_operacional": "2026-06-08",
  "items": [
    {
      "zona": "Coquimbo",
      "total_reconexiones_ejecutadas": 25,
      "total_cortes": 120,
      "corte_en_poste": 80,
      "corte_en_empalme": 40,
      "visita_fallida": 5
    }
  ]
}
```

Comportamiento esperado:

- Si no existe fecha + zona, crear.
- Si ya existe fecha + zona, actualizar.
- No duplicar registros.
- Devolver registros guardados.

---

### 9.3. `PUT /api/resultados-reales-zona/{id}`

Objetivo:

Actualizar una fila individual.

Este endpoint es opcional si `bulk` queda funcionando bien, pero puede implementarse como apoyo futuro.

---

## 10. Validaciones backend

Validar:

- `fecha_operacional` obligatoria.
- `zona` obligatoria.
- Campos numéricos no negativos.
- Campos vacíos deben tratarse como 0 o rechazarse con mensaje claro.
- No duplicar fecha + zona.
- Manejar errores de base de datos.
- Mantener funcionando:
  - `/api/health`
  - `/api/reportes`
  - `/api/programacion-zona`
  - `/api/brigadas-dia`

---

## 11. Frontend esperado

Crear pantalla:

```text
ResultadosRealesZonaPage
```

Estructura sugerida:

```text
frontend/
  src/
    api/
      resultadosRealesZona.api.ts
    pages/
      ResultadosRealesZonaPage.tsx
    types/
      resultadoRealZona.ts
```

---

## 12. Pantalla `ResultadosRealesZonaPage`

Debe incluir:

```text
Título: Resultados reales por zona
Fecha operacional seleccionada
Tabla editable por zona
Botón Guardar resultados
Mensaje de éxito/error
Indicador de carga
```

Columnas principales:

```text
Zona
Total reconexiones ejecutadas
Total Cortes
Corte en poste
Corte en empalme
Visita Fallida
```

---

## 13. Flujo esperado en frontend

1. La usuaria entra con una fecha seleccionada.
2. La pantalla consulta resultados reales para esa fecha.
3. Si no existen resultados, muestra todas las zonas en cero.
4. La usuaria edita los campos numéricos.
5. Presiona `Guardar resultados`.
6. El frontend llama a `POST /api/resultados-reales-zona/bulk`.
7. El sistema crea o actualiza registros.
8. La pantalla muestra mensaje de éxito.

---

## 14. Validaciones frontend

Validar:

- Fecha operacional obligatoria.
- Solo números enteros.
- No permitir negativos.
- Si un campo está vacío, tratarlo como 0.
- Mostrar mensaje claro si backend falla.
- Mostrar mensaje claro al guardar correctamente.

---

## 15. Documentación a crear

Crear o actualizar:

```text
docs/fase_6/00_resultado_fase_6.md
docs/fase_6/01_endpoints_resultados_reales.md
docs/fase_6/02_pantalla_resultados_reales.md
docs/fase_6/03_checklist_fase_6.md
```

---

## 16. Validaciones obligatorias antes de cerrar

Antes de cerrar la fase, validar:

- Backend levanta sin errores.
- Frontend levanta sin errores.
- `/api/health` sigue funcionando.
- `/api/reportes` sigue funcionando.
- `/api/programacion-zona` sigue funcionando.
- `/api/brigadas-dia` sigue funcionando.
- `GET /api/resultados-reales-zona?fecha=YYYY-MM-DD` devuelve zonas con datos o ceros.
- `POST /api/resultados-reales-zona/bulk` crea o actualiza registros.
- La pantalla React muestra todas las zonas.
- La pantalla permite editar los campos.
- La pantalla guarda correctamente.
- No se implementó Resumen por Zona todavía.
- No se implementó exportación Excel.

---

## 17. Checklist de cierre

```text
- [ ] Se leyó documentación previa.
- [ ] Se creó endpoint GET /api/resultados-reales-zona.
- [ ] Se creó endpoint POST /api/resultados-reales-zona/bulk.
- [ ] Se creó endpoint PUT /api/resultados-reales-zona/{id}, si corresponde.
- [ ] Se creó cliente frontend para resultados reales.
- [ ] Se creó pantalla ResultadosRealesZonaPage.
- [ ] Se muestra tabla por zonas.
- [ ] Se pueden editar resultados reales.
- [ ] Se puede guardar en bloque.
- [ ] No se duplican registros por fecha + zona.
- [ ] Se mantiene funcionando Reporte Diario.
- [ ] Se mantiene funcionando Programación por zona.
- [ ] Se mantiene funcionando Brigadas del día.
- [ ] No se creó Resumen por Zona.
- [ ] No se creó exportación Excel.
- [ ] No se creó login ni roles.
- [ ] Se documentó la Fase 6.
```

---

## 18. Resumen final esperado

Al terminar, entregar un resumen con:

```text
1. Archivos creados o modificados.
2. Endpoints creados.
3. Pantalla creada.
4. Comandos usados.
5. Pruebas realizadas.
6. Resultado de validaciones.
7. Confirmación de que no se implementó lógica fuera de Fase 6.
8. Checklist de Fase 6.
9. Siguiente paso recomendado.
```

---

## 19. Comando de inicio

Solo comenzar cuando el usuario escriba:

```text
COMENZAR FASE 6
```

Si el usuario no escribe esa frase, solo leer y comprender esta skill.
