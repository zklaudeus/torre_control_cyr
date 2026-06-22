[CORRECCIÓN]

Objetivo: corregir errores funcionales detectados en Fase 4B — rutas `/me/...` para Supervisor.

Alcance:

- frontend/src/auth/AuthContext.tsx
- frontend/src/components/dashboard/SidebarNav.tsx
- frontend/src/components/supervisor/SupervisorBitacoraView.tsx
- frontend/src/api/supervisores.api.ts
- backend/app/api/routes/supervisores.py
- backend/app/schemas/supervisor_bitacora.py
- backend/app/services/supervisor_bitacora_service.py
- backend/app/schemas/auth.py
- backend/app/services/auth_service.py

Restricciones:

- no avanzar a Fase 4C
- no proteger endpoints globales todavía
- no tocar Reporte Gerencial
- no tocar Resumen General
- no tocar Resumen por Zona
- no tocar Medición
- no tocar Empalme
- no tocar Cleaning Engine
- no hacer refactor masivo
- no hacer merge

Problemas a corregir:

1. Logout inexistente:

- Actualmente al cerrar sesión no existe una acción visible o funcional clara.
- Revisar AuthContext.
- Asegurar que logout elimine:
  - torreControlUser
  - torreControlToken

- Agregar botón visible de “Cerrar sesión” donde corresponda en el layout/sidebar.
- Al cerrar sesión, redirigir a LoginPage o dejar la app sin usuario autenticado.

2. Jose Masso no puede seleccionar CF:

- Jose Masso / Talca debe poder trabajar con PXQ y CF.
- Revisar si el JWT user response incluye `tiposBrigadaPermitidos` o equivalente.
- Revisar si AuthContext pierde ese campo al usar login backend.
- Revisar si SupervisorBitacoraView depende de `user.tiposBrigadaPermitidos`.
- Corregir para que Jose Masso y Nicolas Farias puedan seleccionar CF.
- No forzar PXQ para supervisores que tienen CF permitido.
- Juan Muñoz debe seguir solo PXQ.

3. Error React useEffect:
   Error:
   “The final argument passed to useEffect changed size between renders. Previous: [1] Incoming: [1, [object Object]]”

Corregir dependency arrays en SupervisorBitacoraView.
Regla:

- El array de dependencias de useEffect debe tener siempre el mismo largo y orden.
- No construir dependencias condicionales.
- Si se necesita depender del usuario, usar dependencias estables como:
  - user?.id
  - user?.rol
  - user?.supervisorId

- Evitar pasar objetos completos si cambian en cada render.

4. Error 422 en:
   POST /api/supervisores/me/bitacora/resumen-preview

Revisar payload que envía frontend vs schema backend.
Validar especialmente:

- fecha_operacional
- filas
- total_en_bandeja_por_zona
- codigo_sap
- cuenta
- patente
- brigada
- pareja
- comuna
- tipo_brigada
- carga
- reconexiones
- estado_brigada
- observacion

Corregir nombres de campos, nulls o tipos incompatibles.
Si algún campo puede venir vacío desde frontend, el schema backend debe aceptarlo o el frontend debe normalizarlo antes de enviar.

5. Error null.zonas:
   Error:
   Cannot read properties of null (reading 'zonas')

Corregir actualizarBitacora / validarBitacora para que:

- si resumen-preview falla, no continúe guardando
- si response es null, no intente leer `.zonas`
- mostrar error claro en UI
- no insertar/guardar bitácora si la validación backend falló

6. Cargar brigadas frecuentes:

- Al cargar brigadas frecuentes no debe disparar guardado si la validación backend falla.
- Debe insertar filas en la tabla solo si el payload es válido.
- Si hay errores, mostrar alerta y mantener la pantalla estable.

Validación obligatoria:
Ejecutar:
git status
npm run build

Pruebas manuales:

1. Login juan.munoz:

- cargar brigadas frecuentes
- debe ver solo sus usuarios
- tipo_brigada solo PXQ
- Validar bitácora no debe dar 422

2. Login jose.masso:

- cargar brigadas frecuentes
- debe ver solo Talca
- debe permitir seleccionar PXQ y CF
- Validar bitácora no debe dar 422

3. Logout:

- presionar cerrar sesión
- debe limpiar torreControlUser
- debe limpiar torreControlToken
- debe volver a login

4. Error controlado:

- provocar comuna inválida
- backend debe devolver error/advertencia
- frontend debe mostrarlo
- no debe lanzar TypeError ni leer null.zonas

Salida esperada:

- rama activa
- archivos modificados
- causa encontrada para cada error
- cambios aplicados
- resultado de npm run build
- pruebas manuales sugeridas
- si está listo para commit o no

Fin del prompt
