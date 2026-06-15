Terminar Bitácora Supervisor CyR para que el supervisor no cargue brigadas una por una cada día.

Agregar botón:
“Cargar brigadas frecuentes”

Funcionamiento:

1. Supervisor selecciona fecha operacional.
2. Presiona “Cargar brigadas frecuentes”.
3. La app lee desde BD las brigadas activas del supervisor seleccionado.
4. Llena automáticamente la tabla editable con:
   - Patente habitual
   - Usuario SAP
   - Cuenta
   - Brigada
   - Pareja
   - Comuna habitual
   - Zona principal calculada
   - Carga = 0
   - Reconexiones = 0
   - Estado = Operativa
   - Observación vacía

Si faltan campos en `control_supervisor_usuarios_sap`, agregar:

- patente_habitual
- brigada
- pareja
- comuna_habitual
- activo

Reglas:

- No usar datos temporales ni hardcodeados.
- Todo debe venir desde BD.
- No duplicar filas si se presiona dos veces.
- Si ya existe una bitácora para esa fecha y supervisor, mostrar aviso y cargar lo existente.
- El supervisor solo edita cambios puntuales.
- Al guardar, actualizar `control_brigadas_diario` y programación PXQ por zona.

Botones:

- Cargar brigadas frecuentes
- Agregar fila manual
- Eliminar fila
- Guardar bitácora
- Limpiar

Resultado:
Cada día el supervisor parte con su listado habitual precargado y solo corrige cambios, evitando cargar brigada por brigada.
