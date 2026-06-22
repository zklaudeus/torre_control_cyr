import re

path = 'c:/Users/claud/Desktop/TorreDeControl/frontend/src/components/supervisor/SupervisorBitacoraView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix in cargarBrigadasFrecuentes (around line 673)
content = content.replace("if (!silent) setIsSaving(false);", "setIsSaving(false);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
