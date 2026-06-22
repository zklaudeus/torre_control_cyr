[EJECUCIÓN]

Objetivo: permitir que el supervisor edite brigadas ingresadas desde la Bitácora Supervisor usando dos formas:

1. Botón lápiz de edición por fila.
2. Edición directa/controlada desde la tabla “Lista de Brigadas Ingresadas”.

Contexto:
En Bitácora Supervisor existe una tabla llamada “Lista de Brigadas Ingresadas” con columnas:

- Patente
- Cuenta
- SAP / Nombre
- Brigada
- Tipo
- Pareja
- Zona
- Cortes
- Reconex.
- Estado
- Acciones

Actualmente se muestran las filas cargadas, pero se necesita que el supervisor pueda corregir datos antes de guardar la bitácora.

Alcance:

- frontend/src/components/supervisor/SupervisorBitacoraView.tsx
- frontend/src/components/supervisor/SupervisorBitacoraLogic.ts
- frontend/src/api/supervisores.api.ts si corresponde
- frontend/src/auth/supervisoresTemp.ts si corresponde

Restricciones:

- No tocar Reporte Gerencial.
- No tocar Resumen General.
- No tocar Resumen por Zona.
- No tocar Medición.
- No tocar Empalme.
- No tocar Cleaning Engine.
- No proteger nuevos endpoints.
- No modificar backend salvo que sea estrictamente necesario.
- No hacer refactor masivo.
- No hacer merge.
- No romper Fase 4A ni Fase 4B.
- No cambiar reglas PXQ/CF globales.

Funcionalidad requerida:

1. Edición con lápiz:
   Al presionar el ícono de lápiz en una fila:

- cargar esa brigada en el formulario superior “Ingresar Brigada”
- permitir editar sus campos
- cambiar el botón principal a modo “Actualizar brigada”
- al guardar, actualizar esa fila en la lista
- no duplicar la brigada
- mantener el mismo id interno de la fila si existe

Campos editables:

- Patente
- Cuenta / Proyecto
- Usuario SAP
- Brigada
- Pareja
- Comuna
- Tipo brigada
- Carga / Cortes
- Reconexiones
- Estado
- Observación si existe

2. Edición directa desde tabla:
   Permitir edición controlada en la misma tabla para campos simples:

- Patente
- Brigada
- Pareja
- Tipo
- Cortes
- Reconex.
- Estado

Los campos SAP/Cuenta deben seguir las reglas de autocompletado:

- Si se cambia Cuenta, autocompletar SAP.
- Si se cambia SAP, autocompletar Cuenta.
- No permitir combinaciones SAP/Cuenta inválidas.
- No permitir que un SAP que no pertenece al supervisor sea seleccionado.

3. Normalización obligatoria:
   Antes de actualizar la fila, normalizar:

- patente en mayúsculas y sin espacios
- codigo_sap en mayúsculas
- tipo_brigada solo PXQ o CF
- estado_brigada solo Operativa o Inactiva
- comuna normalizada según catálogo
- zona calculada desde comuna
- carga/cortes como número >= 0
- reconexiones como número >= 0
- textos con trim y sin dobles espacios

4. Validaciones:

- Patente obligatoria si la fila queda activa
- Cuenta obligatoria
- SAP obligatorio
- Brigada obligatoria
- Comuna obligatoria
- Tipo brigada obligatorio
- Estado obligatorio
- Carga y reconexiones deben ser números >= 0
- No permitir duplicado por codigo_sap + tipo_brigada dentro de la bitácora actual
- No permitir SAP de otro supervisor
- Si supervisor solo permite PXQ, no mostrar CF
- Si supervisor permite CF y PXQ, permitir ambas opciones

Reglas por supervisor:

- Juan Muñoz: solo PXQ
- Cynthia Garrido: solo PXQ
- Eduardo Beltrán: solo PXQ
- Nicolas Farias: PXQ y CF
- Jose Masso: PXQ y CF

5. Revalidación:
   Después de editar una fila:

- recalcular/validar resumen usando backend
- llamar a resumen-preview solo al confirmar edición o al presionar Validar bitácora
- no llamar backend en cada tecla
- no continuar guardado si resumen-preview falla

6. UX esperada:

- Al editar con lápiz, resaltar visualmente que se está editando una fila existente.
- Mostrar botón “Cancelar edición”.
- Si el usuario cancela, limpiar formulario y no modificar la fila.
- Si actualiza correctamente, volver a modo “Agregar brigada”.
- Mantener la tabla estable, sin duplicar ni perder filas.
- Mostrar errores de validación de forma clara.

7. No romper carga frecuente:
   Al presionar “Cargar brigadas frecuentes”:

- debe seguir cargando las brigadas del supervisor
- debe permitir editar después de cargarlas
- debe mantener total de cortes, reconexiones y total en bandeja por zona
- no debe lanzar error 422
- no debe lanzar error null.zonas

Validación técnica:
Ejecutar:
git status
npm run build

Pruebas manuales:

1. Login juan.munoz.

2. Cargar brigadas frecuentes.

3. Presionar lápiz en una fila.

4. Cambiar patente, pareja, cortes y reconexiones.

5. Actualizar fila.

6. Confirmar que no se duplica.

7. Confirmar que Juan solo permite PXQ.

8. Validar bitácora sin error.

9. Login jose.masso.

10. Cargar brigadas frecuentes.

11. Editar una fila.

12. Confirmar que puede seleccionar PXQ o CF.

13. Confirmar que solo ve Talca.

14. Validar bitácora sin error.

15. Probar edición directa en tabla.

16. Confirmar que valores se normalizan.

17. Confirmar que duplicados SAP + tipo_brigada se bloquean.

Salida esperada:

- rama activa
- archivos modificados
- cambios aplicados
- explicación breve de cómo editar con lápiz
- explicación breve de cómo editar desde tabla
- resultado de npm run build
- problemas encontrados
- si está listo para commit o no

Fin del prompt
