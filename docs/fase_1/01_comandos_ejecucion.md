# Comandos de Ejecución - Fase 1

## Backend (FastAPI)

1. Crear entorno virtual y activarlo:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Ejecutar el servidor (por defecto en el puerto 8000):
```bash
uvicorn app.main:app --reload
```

## Frontend (React + Vite)

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Ejecutar servidor de desarrollo (por defecto en el puerto 5173):
```bash
npm run dev
```

## Probar comunicación
1. Asegurarse de que el backend está corriendo en http://localhost:8000.
2. Ingresar al frontend en http://localhost:5173.
3. La pantalla inicial indicará si el "Backend conectado correctamente".
4. Alternativamente, se puede probar el endpoint health directamente: `curl http://localhost:8000/api/health`
