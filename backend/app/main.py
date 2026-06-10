from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, reportes, programacion_zona, parametros, brigadas_dia, resultados_reales_zona, resumen_zona
from app.api.routes import parametros_cf, programacion_cf_zona, resultados_reales_cf_zona

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(reportes.router, prefix="/api/reportes", tags=["reportes"])
app.include_router(programacion_zona.router, prefix="/api/programacion-zona", tags=["programacion-zona"])
app.include_router(parametros.router, prefix="/api/parametros", tags=["parametros"])
app.include_router(brigadas_dia.router, prefix="/api/brigadas-dia", tags=["brigadas-dia"])
app.include_router(resultados_reales_zona.router, prefix="/api/resultados-reales-zona", tags=["resultados-reales-zona"])
app.include_router(resumen_zona.router, prefix="/api/resumen-zona", tags=["resumen-zona"])
app.include_router(parametros_cf.router, prefix="/api/parametros-cf", tags=["parametros-cf"])
app.include_router(programacion_cf_zona.router, prefix="/api/programacion-cf-zona", tags=["programacion-cf-zona"])
app.include_router(resultados_reales_cf_zona.router, prefix="/api/resultados-reales-cf-zona", tags=["resultados-reales-cf-zona"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Torre Control CYR EISESA API"}
