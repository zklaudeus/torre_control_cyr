[EJECUCIÓN]

Objetivo: implementar Fase 4A — login backend con JWT, sin proteger endpoints todavía.

Alcance:

- backend/app/core/config.py
- backend/app/core/security.py
- backend/app/schemas/auth.py
- backend/app/services/auth_service.py
- backend/app/repositories/usuario_repository.py
- backend/app/api/routes/auth.py
- backend/app/main.py
- backend/app/models/cyr_models.py
- frontend/src/api/client.ts
- frontend/src/pages/LoginPage.tsx
- frontend/src/auth/AuthContext.tsx

Restricciones:

- No proteger endpoints todavía.
- No modificar Bitácora Supervisor.
- No modificar Reporte Gerencial.
- No modificar Resumen General.
- No modificar Resumen por Zona.
- No tocar Medición.
- No tocar Empalme.
- No tocar Cleaning Engine.
- No eliminar supervisoresTemp.ts todavía.
- No hacer refactor masivo.
- No hacer merge.

Tarea backend:

1. Crear tabla/modelo `control_usuarios` con campos mínimos:
   - id
   - usuario unique
   - password_hash
   - rol
   - supervisor_id nullable
   - activo boolean default true
   - created_at
   - updated_at

2. Agregar configuración JWT en `config.py`:
   - SECRET_KEY
   - ALGORITHM = HS256
   - ACCESS_TOKEN_EXPIRE_MINUTES = 480

3. Crear `backend/app/core/security.py` con:
   - hash_password
   - verify_password
   - create_access_token
   - get_current_user, pero no aplicarlo aún a endpoints existentes

4. Crear schema:
   - LoginRequest
   - TokenResponse
   - CurrentUser

5. Crear service/repository de auth:
   - buscar usuario por username
   - validar password con bcrypt
   - validar activo = true
   - generar JWT con claims:
     - sub
     - rol
     - supervisor_id
     - exp

6. Crear endpoint:
   - POST /api/auth/login

Response esperado:
{
"access_token": "...",
"token_type": "bearer",
"user": {
"usuario": "juan.munoz",
"rol": "supervisor",
"supervisor_id": 1
}
}

Tarea frontend:

1. Crear llamada al endpoint de login desde LoginPage.
2. Guardar token en localStorage con clave:
   - torreControlToken

3. Mantener usuario actual en AuthContext.
4. Agregar interceptor en `client.ts`:
   - Authorization: Bearer <token>

5. Mantener `supervisoresTemp.ts` como fallback temporal solo si falla el backend o si existe modo desarrollo.
6. No cambiar permisos visuales del Sidebar en esta fase.

Usuarios iniciales:
Crear o dejar preparado seed/manual para estos usuarios:

- admin / admin123 / admin
- claudio / admin123 / torre_control
- juan.munoz / admin123 / supervisor
- jose.masso / admin123 / supervisor
- nicolas.farias / admin123 / supervisor
- eduardo.beltran / admin123 / supervisor
- cynthia.garrido / admin123 / supervisor

No guardar password plano. Usar hash.

Validación:
Ejecutar:
git status
npm run build

Si existe:
pytest

Pruebas manuales:

1. Login con admin.
2. Login con claudio.
3. Login con juan.munoz.
4. Revisar en DevTools que se guarde `torreControlToken`.
5. Revisar que las requests salgan con header Authorization.
6. Confirmar que la app visualmente sigue funcionando igual.

Salida esperada:

- rama activa
- archivos modificados/creados
- endpoint creado
- request/response final
- comandos ejecutados
- resultado de build
- problemas encontrados
- si está listo para commit o no

Fin del prompt
