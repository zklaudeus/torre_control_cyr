# 04 — Datos Manuales y Automáticos

A continuación se detalla qué datos ingresa manualmente la usuaria y cuáles calcula automáticamente el sistema.

## 1. Datos Manuales

### Programación diaria por zona

Solo se ingresan 3 campos por zona:

- Reconexiones programadas
- Asignación de carga total en bandeja
- Corte programado

### Brigadas del día

Para cada brigada se ingresan los siguientes detalles:

- Fecha operacional
- Zona
- Código SAP
- Patente
- Usuario
- Tipo brigada: PXQ / CF
- Estado brigada: Operativa / Inactiva
- Hora primer movimiento GPS
- Observación

---

## 2. Datos Automáticos

### Cálculos base y promedios

- Conteo de brigadas (desglose por PXQ, CF)
- Total de brigadas reportadas
- Porcentaje de brigadas efectivas
- Promedios (ej. Promedio Reconexiones, Promedio Cortes, Promedio actividades)
- Cumplimientos (ej. Cumplimiento de corte %, Cumpl\_% Prom. según Meta)
- Total actividades
- Totales generales
- Observaciones automáticas (ej. por brigadas inactivas)

### Datos reales (Temporalmente Manuales, Futuro Automáticos)

Hasta que se integre Neon u otra fuente automática, estos datos se ingresan manualmente como un paso temporal:

- Total reconexiones ejecutadas
- Total Cortes
- Corte en poste
- Corte en empalme
- Visita Fallida
- Primer corte
- Último corte
- Acum_09 a Acum_14
