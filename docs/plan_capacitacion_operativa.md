# Plan de capacitacion operativa - Torre de Control y Supervisores

## Objetivo

Capacitar a Torre de Control y supervisores para usar correctamente lo que ya esta disponible en la plataforma, explicar el sentido del modulo de rendimiento y dejar claro que partes siguen en ajuste.

El mensaje central es:

> La plataforma busca ordenar la operacion diaria, centralizar la bitacora y dar visibilidad al rendimiento por brigada/SAP. La productividad principal se mide por cortes productivos; las reconexiones y fallidas se muestran como indicadores complementarios para gestion.

## Estado actual que se puede mostrar

### Disponible para explicar y practicar

- Login por rol.
- Bitacora del supervisor.
- Carga y guardado de brigadas del dia.
- Validacion de bitacora antes de guardar.
- Restriccion de zonas, supervisores y tipos de brigada segun usuario.
- Resumen general CyR.
- Resumen por zona.
- Panel de rendimiento tecnico por zona y brigada.
- Ficha individual de brigada/SAP.
- KPIs de rendimiento: productividad diaria, reconexiones, promedio, mejor productividad, cumplimiento, acumulado, dias criticos y fallidas.
- Semaforos operacionales por tecnico.
- Seguimiento de fase, advertencias y hallazgos.
- Recomendacion o accion sugerida para seguimiento.

### Explicar como "en ajuste" o "en validacion"

- Las reglas finales de salida de fase.
- El flujo formal de aprobacion para bajar de fase.
- Tratamiento definitivo de datos incompletos.
- Cierre formal de bitacora por Torre de Control.
- Calidad historica de datos cuando una fecha no tiene registro diario contabilizable.
- Diferencias que puedan aparecer entre detalle diario y resumen mensual si faltan datos de origen.

## Reglas simples para explicar

### Productividad

- Productividad principal = cortes productivos.
- Cortes productivos = corte en poste + corte en empalme + corte fuera de rango.
- Reconexiones se muestran aparte; no reemplazan la productividad de cortes.
- Fallidas no descuentan productividad, pero sirven para analizar causas y tomar acciones.
- El objetivo no es castigar, sino detectar temprano desviaciones y hacer seguimiento.

### Dia evaluable

- Un dia se evalua cuando la cuenta SAP aparece en la bitacora diaria y corresponde a una jornada operacional.
- Si una brigada/SAP no fue informada, no deberia interpretarse automaticamente como bajo rendimiento sin revisar la causa.
- Si hay datos incompletos, se debe corregir o aclarar antes de tomar decisiones.

### Estados y fases

- Estado de rendimiento: describe como esta produciendo la brigada.
- Fase de seguimiento: describe el nivel de intervencion o acompanamiento.
- Un tecnico puede estar mejorando en productividad y aun asi seguir en seguimiento hasta que Torre de Control cierre o apruebe la salida.

## Plan de capacitacion para companera de Torre de Control

### Duracion sugerida

2 sesiones de 60 a 75 minutos.

### Objetivo de la capacitacion

Que pueda revisar la operacion diaria, detectar inconsistencias, interpretar KPIs, registrar seguimiento y explicar a supervisores por que una brigada aparece en cierto estado.

### Sesion 1 - Operacion diaria y revision de datos

1. Ingreso al sistema
   - Mostrar login.
   - Explicar que el rol define que pantallas puede ver.
   - Mostrar ruta principal de Torre de Control.

2. Resumen general
   - Mostrar la fecha operacional.
   - Revisar indicadores generales.
   - Explicar que todo depende de la fecha seleccionada.
   - Aclarar que si la fecha no tiene datos, los KPIs pueden aparecer vacios o "Sin datos".

3. Resumen por zona
   - Entrar al resumen por zona.
   - Comparar zonas con mayor y menor actividad.
   - Revisar cortes, reconexiones, fallidas y estados.
   - Explicar que zona sirve para priorizar revision.

4. Bitacora y consistencia
   - Explicar que la bitacora del supervisor es la base de operatividad diaria.
   - Revisar que cuentas SAP, zona, tipo de brigada y carga esten bien.
   - Mostrar validacion antes de guardar.
   - Explicar errores comunes: SAP repetido, zona incorrecta, tipo PXQ/CF incorrecto, patente o carga sin revisar.

5. Ejercicio practico
   - Seleccionar una fecha.
   - Revisar una zona.
   - Identificar una brigada sin datos o con datos bajos.
   - Decidir si corresponde revisar datos, contactar supervisor o registrar seguimiento.

### Sesion 2 - Rendimiento tecnico y seguimiento

1. Panel por zonas
   - Entrar a Rendimiento Tecnico.
   - Mostrar que primero se selecciona una zona.
   - Explicar que luego aparece el listado de brigadas/SAP de esa zona.

2. Ficha de brigada
   - Seleccionar una brigada.
   - Revisar nombre, codigo SAP, zona, patente, supervisor y fecha.
   - Explicar que la cuenta SAP es la identidad principal; la patente puede cambiar.

3. KPIs
   - Productividad diaria: cortes productivos y reconexiones.
   - Productividad promedio: comportamiento del periodo.
   - Mejor productividad: maximo observado.
   - Cumplimiento: cortes vs meta.
   - Acumulado: suma mensual.
   - Fallidas: indicador de analisis, no castigo directo.
   - Dias criticos: dias bajo umbral.

4. Click en tarjetas KPI
   - Mostrar que cada tarjeta abre detalle.
   - Explicar que cuando no hay detalle diario, el sistema puede mostrar "Sin datos" o un aviso.
   - Aclarar que eso no siempre es error de sistema: puede faltar registro operacional para esa fecha.

5. Semaforos y hallazgos
   - Explicar semaforos como alertas operacionales.
   - Revisar hallazgos recurrentes.
   - Explicar que los hallazgos ayudan a orientar accion, no son una sentencia automatica.

6. Fase de seguimiento
   - Explicar Fase 1, Fase 2 y Fase 3.
   - Registrar advertencia solo con motivo claro.
   - Cambiar fase solo cuando la regla y la evidencia lo justifican.
   - Nunca cerrar seguimiento solo por intuicion: debe quedar trazabilidad.

7. Ejercicio practico
   - Tomar una brigada critica.
   - Revisar KPIs.
   - Revisar fallidas.
   - Revisar semaforos.
   - Redactar una accion recomendada para hablar con supervisor.

### Guion breve para explicarle a Torre de Control

"Primero revisamos la fecha operacional y la zona. La plataforma nos muestra si la informacion diaria esta completa y como se comporta cada brigada. Para rendimiento miramos principalmente cortes productivos; las reconexiones se muestran aparte y las fallidas nos ayudan a explicar causas. Si una brigada aparece critica, no se toma una decision solo mirando un numero: se revisa el detalle, la bitacora, los semaforos, hallazgos y luego se registra una advertencia o accion con motivo."

## Plan de capacitacion para supervisores

### Duracion sugerida

1 sesion de 60 minutos por grupo, mas 20 minutos de preguntas.

### Objetivo de la capacitacion

Que cada supervisor pueda cargar bien su bitacora diaria, entender como esa informacion afecta los paneles y usar los KPIs para conversar con sus brigadas.

### Sesion unica - Uso diario del supervisor

1. Ingreso
   - Mostrar login.
   - Explicar que el supervisor entra directo a su bitacora.
   - Aclarar que ve solo lo que corresponde a su rol.

2. Fecha operacional
   - Revisar la fecha antes de cargar.
   - Explicar que una fecha equivocada genera datos mal ubicados.

3. Seleccion del supervisor
   - Si el usuario es supervisor, el sistema deja fijo su supervisor.
   - Si Torre de Control usa la pantalla, puede seleccionar supervisor.

4. Cargar brigadas frecuentes
   - Mostrar boton para cargar brigadas frecuentes.
   - Explicar que es una ayuda inicial, no reemplaza la revision del dia.
   - El supervisor debe eliminar, modificar o agregar lo que corresponda.

5. Completar bitacora
   - Cuenta SAP.
   - Nombre o brigada.
   - Zona/comuna.
   - Tipo de brigada PXQ o CF.
   - Patente.
   - Carga o programacion del dia.
   - Observaciones cuando aplique.

6. Validar antes de guardar
   - Mostrar el boton "Validar bitacora".
   - Explicar errores tipicos:
     - SAP duplicado.
     - Falta zona.
     - Falta tipo de brigada.
     - Brigada que no corresponde al supervisor.
     - Tipo CF no permitido para el usuario.

7. Guardar bitacora
   - Guardar solo cuando la informacion este revisada.
   - Explicar que esa informacion alimenta los indicadores de rendimiento.

8. Ver rendimiento
   - Mostrar resumen por zona o rendimiento tecnico si el rol tiene acceso.
   - Explicar que el supervisor debe mirar tendencias, no solo un dia aislado.

9. Conversacion con la brigada
   - Usar cortes productivos como indicador principal.
   - Usar reconexiones como complemento.
   - Revisar fallidas para entender causas.
   - Levantar observaciones si la informacion no coincide con la realidad.

### Guion breve para supervisores

"La bitacora es la base del dia. Si la cuenta SAP, zona, tipo de brigada o carga quedan mal, despues los indicadores tambien quedaran mal. Por eso lo primero es revisar bien la fecha, cargar las brigadas correctas, validar y guardar. Luego los KPIs no se usan para castigar automaticamente; sirven para detectar donde hay que apoyar, corregir datos o conversar con la brigada."

## Demostracion sugerida paso a paso

### Demo 1 - Supervisor

1. Iniciar sesion como supervisor.
2. Entrar a Bitacora Supervisor.
3. Confirmar fecha operacional.
4. Cargar brigadas frecuentes.
5. Editar una fila.
6. Validar bitacora.
7. Corregir un error simulado.
8. Guardar bitacora.
9. Explicar que esto alimenta el seguimiento del dia.

### Demo 2 - Torre de Control

1. Iniciar sesion como Torre de Control.
2. Abrir resumen general.
3. Cambiar fecha operacional.
4. Abrir resumen por zona.
5. Entrar a rendimiento tecnico.
6. Seleccionar zona.
7. Seleccionar brigada.
8. Abrir KPI de productividad diaria.
9. Abrir KPI de fallidas.
10. Revisar semaforos y hallazgos.
11. Registrar o explicar una accion de seguimiento.

## Preguntas esperadas y respuestas recomendadas

### "Por que mi brigada aparece sin datos?"

Respuesta:
"Puede deberse a que no existe registro diario contabilizable para esa fecha, a que la bitacora no fue cargada correctamente o a que falta procesar informacion. Primero revisamos fecha, cuenta SAP y bitacora."

### "Las reconexiones cuentan para productividad?"

Respuesta:
"No reemplazan los cortes productivos. Se muestran para tener contexto operacional, pero el cumplimiento principal se calcula con cortes productivos."

### "Las fallidas bajan mi productividad?"

Respuesta:
"No descuentan productividad directamente. Sirven para analizar causas, detectar problemas de terreno y definir acciones."

### "Si cambio de patente, se crea otra brigada?"

Respuesta:
"No. La identidad principal es la cuenta SAP. La patente es informacion operacional del dia."

### "Por que una brigada sigue en fase si ya mejoro?"

Respuesta:
"Porque estado y fase no son lo mismo. El estado puede mejorar con los datos, pero la salida de fase requiere revision y aprobacion de Torre de Control."

### "Que hago si el sistema no coincide con mi realidad del dia?"

Respuesta:
"No se corrige verbalmente. Se revisa la bitacora, se corrige el dato de origen si corresponde y se deja observacion."

## Material de apoyo para entregar

### Una pagina para supervisores

- Revisar fecha.
- Cargar brigadas correctas.
- Validar antes de guardar.
- Corregir errores.
- Guardar.
- Revisar indicadores.
- Avisar diferencias con respaldo.

### Una pagina para Torre de Control

- Revisar fecha y zona.
- Confirmar calidad de datos.
- Revisar KPIs y detalle.
- Diferenciar productividad, reconexiones y fallidas.
- Revisar semaforos/hallazgos.
- Registrar seguimiento con motivo.
- Escalar casos con evidencia.

## Checklist antes de capacitar

- Tener una fecha con datos reales para demo.
- Tener al menos un usuario supervisor de prueba.
- Tener un usuario Torre de Control.
- Tener una brigada con datos normales.
- Tener una brigada con datos bajos.
- Tener una brigada o fecha con "Sin datos" para explicar el caso.
- Confirmar que el build desplegado contiene los ultimos cambios del KPI de productividad diaria.
- Preparar 3 casos practicos: carga correcta, error de bitacora, revision de rendimiento.

## Cierre recomendado de la capacitacion

"La plataforma no reemplaza el criterio operacional. Ordena la informacion, muestra desviaciones y deja trazabilidad. La responsabilidad de supervisor es cargar bien la bitacora y revisar sus brigadas. La responsabilidad de Torre de Control es validar, interpretar y hacer seguimiento con evidencia."
