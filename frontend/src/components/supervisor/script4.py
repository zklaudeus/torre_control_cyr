import re

path = 'c:/Users/claud/Desktop/TorreDeControl/frontend/src/components/supervisor/SupervisorBitacoraView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update validarBitacora signature and silent usage
val_old = "const validarBitacora = async (customRows?: BitacoraRow[]) => {"
val_new = "const validarBitacora = async (customRows?: BitacoraRow[], silent = false) => {"
content = content.replace(val_old, val_new)

content = content.replace("setIsSaving(true);", "if (!silent) setIsSaving(true);")
content = content.replace("setIsSaving(false);", "if (!silent) setIsSaving(false);")

# Update message setting inside validarBitacora
msg_logic_old = '''      if (!customRows) {
        setMessage({ text: msg, type });
      }'''
msg_logic_new = '''      if (!customRows && !silent) {
        setMessage({ text: msg, type });
      }'''
content = content.replace(msg_logic_old, msg_logic_new)

# 2. Add useEffect for debounced validation
effect = '''
  // Debounced auto-validation for inline edits
  useEffect(() => {
    if (rows.length === 0) return;
    const timer = setTimeout(() => {
      validarBitacora(rows, true);
    }, 800);
    return () => clearTimeout(timer);
  }, [rows, asignacionCarga]);
'''
content = content.replace("  const handleInlineChange =", effect + "\n  const handleInlineChange =")

# 3. Fix the onChange in inputs to onBlur for texts/numbers to avoid triggering on every keystroke if they type fast? 
# The debounce is 800ms, which is fine for keystrokes. But just in case, we leave it on onChange.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
