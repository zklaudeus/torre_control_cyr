FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Copiar e instalar los requerimientos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente
COPY entrypoint.sh .
RUN groupadd --system app && useradd --system --gid app --home /app app
COPY --chown=app:app . .
RUN chmod +x entrypoint.sh

USER app

# Exponer el puerto
EXPOSE 8000

# Comando de inicio: migraciones + uvicorn
CMD ["./entrypoint.sh"]
