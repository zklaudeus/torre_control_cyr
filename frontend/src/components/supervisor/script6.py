import re

path = 'c:/Users/claud/Desktop/TorreDeControl/frontend/src/components/supervisor/SupervisorBitacoraView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix in guardarFila (lines 308, 350)
content = content.replace("try {\n      if (!silent) setIsSaving(true);", "try {\n      setIsSaving(true);")
content = content.replace("finally {\n      if (!silent) setIsSaving(false);", "finally {\n      setIsSaving(false);")
content = content.replace("try {\n      setIsSaving(true);\n      const payload: any", "try {\n      setIsSaving(true);\n      const payload: any") # in case there was no if (!silent)

# Fix in cargarBrigadasFrecuentes
content = content.replace("faltantes.forEach((s, i) => {", "faltantes.forEach(s => {")
content = content.replace("if (!silentGuardar) setIsSaving(true);", "setIsSaving(true);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
