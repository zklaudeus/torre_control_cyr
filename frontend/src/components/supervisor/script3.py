import re

path = 'c:/Users/claud/Desktop/TorreDeControl/frontend/src/components/supervisor/SupervisorBitacoraView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: type casting for tipoBrigada
content = content.replace("tipoBrigada: s.tipo_brigada || 'PXQ'", "tipoBrigada: (s.tipo_brigada as 'PXQ' | 'CF') || 'PXQ'")

# Fix 2: type casting for handleInlineChange value
# `const updated = { ...r, [field]: value, _errors: undefined };`
# is causing an issue because `field` is keyof BitacoraRow, and value is string.
# Let's cast it as `any`.
content = content.replace("const updated = { ...r, [field]: value, _errors: undefined };", "const updated = { ...r, [field]: value, _errors: undefined } as any;")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
