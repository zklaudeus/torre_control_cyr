# 02 — Flujo Principal de la Beta

El flujo de trabajo que la aplicación debe seguir se basa en la simplicidad y en garantizar que la usuaria ingrese la información en el orden correcto para permitir el cálculo automático final. 

El flujo principal de la aplicación será estrictamente el siguiente:

```text
Fecha → Brigadas del día → Programación por zona → Resumen automático → Exportar Excel
```

## Pasos detallados
1. **Fecha (Reporte Diario):** El usuario ingresa a la aplicación y selecciona la fecha operacional que desea reportar. Se abre o crea el reporte del día.
2. **Brigadas del día:** El usuario carga o registra las brigadas disponibles (con su tipo, zona, estado, etc.). El sistema debe totalizarlas automáticamente.
3. **Programación por zona:** El usuario introduce los tres datos manuales requeridos por zona (Reconexiones programadas, Asignación de carga, Corte programado).
4. **Resumen automático:** La aplicación calcula automáticamente el resto de las variables (promedios, cumplimientos, porcentajes, etc.) cruzando datos de brigadas, programación y resultados reales. Esta pantalla es solo de visualización.
5. **Exportar Excel:** Una vez verificada la pantalla de resumen, el usuario exporta el resultado a un archivo Excel limpio y ordenado para distribución.
