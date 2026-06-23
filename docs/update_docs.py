import os
import re

def update_file(filepath):
    if not os.path.exists(filepath):
        print(f"File {filepath} not found.")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Reemplazar 'productividad neta' y 'cortes efectivos'
    content = content.replace('productividad neta', 'cortes productivos')
    content = content.replace('Productividad neta', 'Cortes productivos')
    content = content.replace('cortes efectivos menos visitas fallidas', 'corte en poste, corte en empalme y corte fuera de rango')
    content = content.replace('cortes efectivos', 'cortes productivos')
    content = content.replace('Cortes efectivos', 'Cortes productivos')
    content = content.replace('max(0, cortes productivos − visitas fallidas)', 'corte en poste + corte en empalme + corte fuera de rango')
    content = content.replace('max(0, Cortes productivos del día - VF_d)', '(Cortes productivos del día / Meta aplicable del día) * 100')
    content = content.replace('max(0, cortes productivos - visitas fallidas)', 'cortes productivos')
    content = content.replace('max(0, poste + empalme + fuera de rango − fallidas)', 'poste + empalme + fuera de rango')
    
    # Específicos para diseno_tecnico_rendimiento.md
    content = content.replace('Cortes productivos con piso cero', 'Cortes productivos')
    content = content.replace('calcular cortes productivos con piso cero', 'calcular cortes productivos')

    # 2. Correcciones en reglas_productividad_rendimiento.md
    if 'reglas_productividad_rendimiento.md' in filepath:
        # Reemplazos específicos por bloques
        
        # Bloque Visitas fallidas
        block_fallidas_old = """- Toda visita fallida resta una unidad de productividad en esta primera versión.
- No se implementará aún diferenciación por causa.
- La cantidad de fallidas debe conservarse separadamente para trazabilidad.
- El tratamiento especial de causas no imputables queda para una fase posterior.
- Si las fallidas superan los cortes productivos, la cortes productivos queda en cero; nunca es negativa."""
        
        block_fallidas_new = """Las visitas fallidas **NO deben usarse para**:
- Categoría productiva o estado productivo.
- Racha bajo 50% o racha de cumplimiento.
- Activación automática de fase.

Las visitas fallidas **solo deben usarse para**:
- Total del día por usuario SAP.
- Variación porcentual vs día anterior.
- Acumulados (7 días, 14 días, mensual).
- Análisis por causa de fallida.
- Hallazgos y recomendaciones para supervisor y gerencia.

### 5.5.1 Variación de fallidas

```text
fallidas_variacion_abs = fallidas_hoy - fallidas_dia_anterior

fallidas_variacion_pct = 
  si fallidas_dia_anterior > 0:
    ((fallidas_hoy - fallidas_dia_anterior) / fallidas_dia_anterior) * 100
  si fallidas_dia_anterior = 0:
    usar null o advertencia "sin base comparativa"
```
Interpretación:
- **Positivo**: aumentaron fallidas.
- **Negativo**: disminuyeron fallidas.
- **Cero**: sin variación.

### 5.5.2 Tratamiento de causa fallida

La causa de fallida debe visualizarse en pantalla para que gerencia y supervisores puedan analizar en reunión:
- Causas más frecuentes por técnico y por zona.
- Evolución de fallidas por período.
- Acciones para reducir casos repetidos."""
        
        content = content.replace(block_fallidas_old, block_fallidas_new)
        
        # Las reconexiones no forman parte...
        content = content.replace('Las visitas fallidas se restan directamente de los cortes productivos, sin diferenciación por causa en esta primera versión.', 'Las visitas fallidas NO se descuentan de la productividad, y solo se usarán para análisis y seguimiento.')
        
        # Bloque ausencias
        old_ausencias = "18. La cortes productivos nunca puede ser menor que cero."
        new_ausencias = "18. Una ausencia es un día no evaluable y no rompe, no suspende ni reinicia la racha."
        content = content.replace(old_ausencias, new_ausencias)
        
        # Bloque Bitacora
        old_bitacora = """La ausencia solo puede interpretarse como permiso/licencia después de que el supervisor haya terminado o cerrado la Bitácora del día. Mientras la lista esté abierta o incompleta, el sistema no debe evaluar ausencias ni recalcular estados/fases. Esta salvaguarda evita clasificar a todas las cuentas como no operativas por una carga tardía o una falla de registro."""
        
        new_bitacora = """Una ausencia:
- Es día no evaluable.
- No suma productividad cero.
- **No rompe, no suspende ni reinicia la racha.** La racha se calcula solo sobre días evaluables.

Causas manuales de ausencia que se deben soportar:
- Permiso
- Licencia médica
- Vacaciones
- Ausencia de maestro
- No reportado
- Otra causa

**Flujo de Bitácora:**
- **Apertura de bitácora:** La realiza el supervisor cuando comienza a asignar usuarios SAP, cargas, zonas y carga en bandeja.
- **Cierre de bitácora:** Lo realiza **Torre de Control**.
- La ausencia o presencia solo se considera definitiva después del cierre de Torre de Control. Mientras esté abierta, el sistema no evalúa ausencias."""
        
        content = content.replace(old_bitacora, new_bitacora)

        # Fase 3
        old_fase3 = """Fase 3 =
  pendiente de definición;
  debe reservarse para reincidencia grave o bajo rendimiento mantenido,
  pero no existe aún un disparador exacto aprobado."""
        new_fase3 = """Fase 3 =
  se activa al registrar la tercera advertencia en Fase 2;
  las advertencias las registra Torre de Control;
  NO se activa automáticamente por fallidas."""
        content = content.replace(old_fase3, new_fase3)

        content = content.replace("Fase 2 -> Fase 3: pendiente de confirmación.", "Fase 2 -> Fase 3: al registrar la tercera advertencia por Torre de Control en Fase 2. La salida requiere acción/aprobación de Torre de Control.")

        # Limpieza de redundancias
        content = content.replace('cortes productivos netos de fallidas', 'cortes productivos')
        content = content.replace('cortes productivos neta', 'cortes productivos')
        content = content.replace('productividad diaria principal = cortes productivos', 'productividad diaria principal = cortes productivos')

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"No changes needed in {filepath}")

update_file(r"c:\Users\claud\Desktop\TorreDeControl\docs\reglas_productividad_rendimiento.md")
update_file(r"c:\Users\claud\Desktop\TorreDeControl\docs\diseno_tecnico_rendimiento.md")
update_file(r"c:\Users\claud\Desktop\TorreDeControl\docs\usuario\contexto.md")
