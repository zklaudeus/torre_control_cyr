Crear módulo “Bitácora Supervisor CyR” solo para piloto Juan Muñoz / Concepción.

No modificar lo existente de Torre Control.
No romper CyR actual.
No implementar Medición ni Empalme.

Agregar sección visual:
CyR → Supervisor → Ingresar bitácora de hoy

Formulario tipo tabla editable con columnas:

- Patente
- Usuario SAP
- Cuenta
- Brigada
- Pareja
- Comuna
- Carga
- Reconexiones
- Observación

Validaciones:

- Patente formato: 4 letras + 2 números. Ejemplo VSXK79.
- Usuario SAP formato: P + 6 números. Ejemplo P003372.
- Cuenta debe estar vinculada a un único Usuario SAP.
- Usuario SAP debe estar vinculado a una única Cuenta.
- Carga y Reconexiones deben ser números >= 0.
- Campos obligatorios: Patente, Usuario SAP, Cuenta, Brigada, Comuna.

Crear catálogo interno temporal para SAP ↔ Cuenta.
Ejemplo:
P003372 → Jose Bravo

Si el supervisor selecciona Usuario SAP, autocompletar Cuenta.
Si selecciona Cuenta, autocompletar Usuario SAP.
No permitir combinaciones distintas.

Mapeo Comuna → Zona:
Concepción:

- Coronel
- Concepcion
- Chiguayante
- Talcahuano
- San Pedro
- Hualpen
- Penco
- Tome
- Coelemu

Chillán:

- San Carlos
- Chillan Viejo
- Chillan

Los Ángeles:

- Los Ángeles

Reglas:

- comuna se usa para el supervisor.
- zona se calcula automáticamente según comuna.
- cortes = cortes programados.
- Reconexiones = reconexiones programadas.

Al guardar:

1. Crear o actualizar brigadas del día usando:
   - zona calculada
   - patente
   - codigo_sap
   - usuario/cuenta
   - tipo_brigada = PXQ
   - estado_brigada = Operativa, Inactiva

2. Calcular programación por zona:
   - corte_programado 
   - reconexiones_programadas 

3. Permitir ingresar manualmente “Total en bandeja = carga por zona” por zona.
4. Guardar/actualizar programación diaria PXQ por zona.

Agregar resumen antes de guardar:

- Total brigadas
- Corte total por zona
- Reconexiones total por zona
- Total en bandeja por zona
- Errores de validación

Botones:

- Agregar fila
- Eliminar fila
- Validar bitácora
- Guardar bitácora de hoy
- Limpiar

Primera versión:

- Solo habilitar supervisor Juan Muñoz.
- Solo zonas calculadas: Concepción, Chillán, Los Ángeles.
- No importar Excel todavía.
- No OCR.
- Todo debe ser ingreso manual web tipo Excel.

Resultado:
El supervisor ingresa lo mismo que hoy hace en Excel, pero directo en la plataforma. Torre Control deja de cargar esa parte manualmente y solo se encarga de los avances diarios.

Ajustar módulo “Bitácora Supervisor CyR”.

Cuando el supervisor guarde la bitácora diaria, debe actualizar directamente la información que ve Torre Control en CyR.

Usar las mismas tablas/endpoints actuales:

- Brigadas del día
- Programación diaria PXQ/CF por zona

No crear datos separados para supervisor.

Al guardar bitácora:

1. Crear o actualizar brigadas en `control_brigadas_diario`.
2. Usar `codigo_sap` como identificador principal.
3. Actualizar zona, patente, usuario/cuenta, tipo_brigada y estado_brigada.
4. Mantener limpios los campos de avance del día si es una brigada nueva.
5. Calcular programación por zona:
   - corte_programado = suma de cortes
   - reconexiones_programadas = suma de reconexiones por zona
   - total_en_bandeja = valor ingresado por zona

6. Guardar/actualizar programación diaria.
7. Después de guardar, refrescar las vistas de Torre Control.

Resultado esperado:
Lo que ingresa el supervisor queda disponible automáticamente para Torre Control en CyR, evitando que Torre Control tenga que cargar manualmente la programación inicial.
