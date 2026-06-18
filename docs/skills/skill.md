Ejecutar solo Fase 2 de migración frontend → backend, trabajando en una rama nueva de Git.

Antes de modificar archivos:

1. Verificar estado actual:
   - `git status`

2. Crear rama nueva desde la rama actual:
   - `git checkout -b feature/backend-supervisor-sap-seguro`

3. Confirmar rama activa:
   - `git branch`

Modo ejecución controlada.
No hacer refactor masivo.
No tocar KPIs.
No tocar Reporte Gerencial.
No tocar Resumen General.
No tocar Medición.
No tocar Empalme.
No modificar lógica PXQ/CF salvo lo necesario para filtrar supervisor.
No trabajar directo en `master` ni en la rama principal.

Objetivo:
Mover al backend la obtención segura de usuarios SAP por supervisor, para que el frontend no use `getAllUsuariosSap()` ni filtre usuarios sensibles localmente.

Problema actual:
La Bitácora Supervisor puede traer todos los usuarios SAP y luego filtrar en frontend. Eso no es correcto por seguridad ni buenas prácticas.

Implementar endpoint seguro:

Preferido si existe auth con usuario actual:
GET `/api/supervisores/me/usuarios-sap`

Si todavía no existe auth backend real:
GET `/api/supervisores/{supervisor_id}/usuarios-sap`

El endpoint debe:

- Filtrar por `supervisor_id`
- Filtrar `activo = true`
- Devolver solo usuarios asociados a ese supervisor
- Hacer join con `control_supervisor_comunas_zonas`
- Devolver `zona_principal`
- No devolver usuarios de otros supervisores
- No devolver datos globales

Response esperado:

- id
- supervisor_id
- codigo_sap
- cuenta
- tipo_brigada
- patente_habitual
- brigada
- pareja
- comuna_habitual
- zona_principal
- activo

Backend:

- Revisar modelos existentes de supervisores.
- Revisar routes actuales de supervisores.
- Crear o ajustar repository/service si corresponde.
- No borrar endpoint global si otra parte lo usa, pero no usarlo en Bitácora Supervisor.
- Agregar validación: si no existe supervisor, responder 404.
- Si usuario no tiene zona_principal, devolverlo con `zona_principal = null`.

Frontend:

- En Bitácora Supervisor, reemplazar uso de `getAllUsuariosSap()` por endpoint filtrado por supervisor.
- El botón “Cargar brigadas frecuentes” debe usar solo usuarios del supervisor actual.
- Si no hay supervisor seleccionado/autenticado, bloquear carga y mostrar error.
- No mezclar usuarios entre supervisores.
- Mantener la UI actual.
- Mantener Juan Muñoz funcionando.
- Mantener Supervisor Talca funcionando.
- Supervisor Talca debe cargar solo Talca.
- Juan Muñoz debe cargar solo Concepción, Chillán y Los Ángeles.

Validaciones manuales:

1. Login Juan Muñoz:
   - Cargar brigadas frecuentes.
   - Debe ver solo sus usuarios.
   - No debe ver Talca, Coquimbo, Iquique ni Santa Cruz.

2. Login Supervisor Talca:
   - Cargar brigadas frecuentes.
   - Debe ver solo usuarios Talca.
   - Debe permitir CF y PXQ.
   - No debe ver usuarios de Juan Muñoz.

3. Login Admin:
   - No debe romper flujo actual.

Al finalizar:

- Ejecutar `git status`
- No hacer merge.
- No cambiar de rama.
- No borrar la rama.

Entrega final:

- Rama creada.
- Archivos modificados.
- Endpoints creados/modificados.
- Comandos ejecutados.
- Comandos para probar.
- Resumen breve.
