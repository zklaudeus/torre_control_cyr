"""
rules.py — Reglas de clasificación operacional y alias de columnas.

Basado en análisis de Excel reales (Export SAPUI5):
- Columna 'Descripción Código Medida' es la fuente de verdad para clasificación.
- Columna 'Foto' contiene literales 'SI' / 'NO'.
- Columna 'Usuario' contiene el código SAP directamente (P004985, etc).
- Columna 'Numero de aviso' es el ID único de actividad (clave de deduplicación).
"""

# ──────────────────────────────────────────────────────────────────────────────
# ALIAS DE COLUMNAS
# Mapeo de nombres reales de columna → nombre canónico interno.
# ──────────────────────────────────────────────────────────────────────────────

COLUMN_ALIASES: dict[str, str] = {
    # Código SAP del técnico
    "usuario": "codigo_sap",

    # Nombre del técnico
    "nombre de usuario": "usuario_nombre",

    # ID único de actividad
    "numero de aviso": "aviso_id",

    # Descripción de la medida (clasificación)
    "descripción código medida": "medida",
    "descripcion codigo medida": "medida",
    "descripcin cdigo medida": "medida",
    "descripcin cdigo medida": "medida",
    "descripcin código medida": "medida",

    # Foto (SI / NO)
    "foto": "foto",

    # Timestamp de ejecución
    "ejecutada": "ejecutada",

    # Zona geográfica
    "comuna": "comuna",

    # Empresa
    "empresa": "empresa",

    # Código de evento (Z8=Desconexión, Z9=Reconexión)
    "código de evento": "evento_codigo",
    "codigo de evento": "evento_codigo",
    "cdigo de evento": "evento_codigo",

    # Grupo de medida (ZCORTE02, ZREPO002, etc.)
    "grupo de medida": "grupo_medida",
}

# ──────────────────────────────────────────────────────────────────────────────
# CLASIFICACIÓN DE MEDIDAS
# ──────────────────────────────────────────────────────────────────────────────

# Medidas que generan corte (sin importar foto)
MEDIDAS_CORTE_POSTE: set[str] = {
    "corte en poste",
}

MEDIDAS_CORTE_EMPALME: set[str] = {
    "corte en empalme",
}

MEDIDAS_DESMANTELAMIENTO: set[str] = {
    "desmantelamiento de empalme",
    "retiro de acometida",
    "reponer desmantelamiento empalme",
}

# Medidas de reposición (reconexiones)
MEDIDAS_REPOSICION: set[str] = {
    "reposición en poste",
    "reposicion en poste",
    "reposicin en poste",
    "reposición en empalme",
    "reposicion en empalme",
    "reposicin en empalme",
    "reposición de acometida",
    "reposicion de acometida",
    "reposicin de acometida",
    "auto-repuesto",
    "auto repuesto",
}

# Medida especial: depende de si tiene foto
MEDIDA_FUERA_DE_RANGO: str = "fuera de rango"

# Medidas que siempre son visita fallida (independiente de foto)
MEDIDAS_FALLIDA: set[str] = {
    "sin acceso",
    "no ubicado",
    "casa cerrada",
    "caso sensible",
    "cliente no da acceso",
    "zona peligrosa",
    "persona enferma",
    "enviado a capturador",
    "recepcionado por capturador",
}

# Valores de columna Foto que se consideran "sin foto"
FOTO_VALORES_INVALIDOS: set[str] = {
    "", "no", "0", "-", "sin foto", "none", "nan", "n/a",
}

# ──────────────────────────────────────────────────────────────────────────────
# CATEGORÍAS Y SUS KPIs
# ──────────────────────────────────────────────────────────────────────────────

# Categorías que suman a total_cortes
CATEGORIAS_TOTAL_CORTES: set[str] = {
    "corte_poste",
    "corte_empalme",
    "desmantelamiento",
    "corte_fuera_de_rango",
}

# Categorías que suman a reconexiones_ejecutadas
CATEGORIAS_RECONEXIONES: set[str] = {
    "reposicion",
    "corte_fuera_de_rango",
}

# ──────────────────────────────────────────────────────────────────────────────
# ZONAS: mapeo de código de establecimiento / proceso → zona del sistema
# ──────────────────────────────────────────────────────────────────────────────

# Prefijos de proceso → zona en control_brigadas_diario
PROCESO_A_ZONA: dict[str, str] = {
    "G_CE45": "Concepción",
    "G_CE46": "Los Ángeles",
    "G_CE47": "Chillán",
    "G_CE09": "Iquique",
    "G_CE60": "Talca",
    "G_CE17": "Santa Cruz",
    "G_CE04": "Coquimbo",
}

# Mapeo de comuna SAP → zona del sistema (fallback si proceso no está)
COMUNA_A_ZONA: dict[str, str] = {
    "concepcion": "Concepción",
    "concepción": "Concepción",
    "los angeles": "Los Ángeles",
    "los ángeles": "Los Ángeles",
    "chillan": "Chillán",
    "chillán": "Chillán",
    "iquique": "Iquique",
    "talca": "Talca",
    "santa cruz": "Santa Cruz",
    "coquimbo": "Coquimbo",
    "la serena": "Coquimbo",
    "ovalle": "Coquimbo",
}

# ──────────────────────────────────────────────────────────────────────────────
# ALIAS DE NOMBRES DE USUARIO
# Mapeo de nombre completo (normalizado) -> {"codigo_sap": "...", "usuario_visual": "..."}
# ──────────────────────────────────────────────────────────────────────────────
USUARIO_ALIAS: dict[str, dict[str, str]] = {
    "sebastian ignacio rodriguez quezada": {
        "codigo_sap": "P004562",
        "usuario_visual": "Sebastian Rodriguez"
    },
    "sebastian rodriguez": {
        "codigo_sap": "P004562",
        "usuario_visual": "Sebastian Rodriguez"
    },
    "fabian saavedra": {
        "codigo_sap": "P004982",
        "usuario_visual": "Fabian Saavedra"
    },
    # Victor Gonzalez — acepta ambas grafías (con Z y con S)
    "victor gonzalez": {
        "codigo_sap": "P004955",
        "usuario_visual": "Victor Gonzalez"
    },
    "victor gonzales": {
        "codigo_sap": "P004955",
        "usuario_visual": "Victor Gonzalez"
    },
    "bastian saavedra": {
        "codigo_sap": "P004957",
        "usuario_visual": "Bastian Saavedra"
    }
}
