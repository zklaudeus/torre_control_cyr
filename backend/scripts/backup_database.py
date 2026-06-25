"""Crea y verifica un respaldo lógico PostgreSQL sin exponer credenciales."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy.engine import make_url

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


DEFAULT_BACKUP_DIR = BACKEND_ROOT.parent / ".backups"


def resolve_postgres_tool(name: str) -> str:
    """Encuentra las herramientas PostgreSQL tanto en Windows como en Linux."""
    configured_bin = os.environ.get("POSTGRES_BIN")
    candidates = []
    if configured_bin:
        candidates.append(Path(configured_bin) / name)
        candidates.append(Path(configured_bin) / f"{name}.exe")

    candidates.extend([
        Path(r"C:\Program Files\PostgreSQL\16\bin") / f"{name}.exe",
        Path(r"C:\Program Files\PostgreSQL\15\bin") / f"{name}.exe",
    ])

    path_tool = shutil.which(name) or shutil.which(f"{name}.exe")
    if path_tool:
        return path_tool
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    raise RuntimeError(
        f"No se encontró {name}. Instala el cliente PostgreSQL o define POSTGRES_BIN."
    )


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def backup_database() -> dict[str, object]:
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")

    pg_dump = resolve_postgres_tool("pg_dump")
    pg_restore = resolve_postgres_tool("pg_restore")

    url = make_url(settings.DATABASE_URL)
    database = url.database
    if not database:
        raise RuntimeError("DATABASE_URL no contiene nombre de base de datos")

    DEFAULT_BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    destination = DEFAULT_BACKUP_DIR / f"{database}_etapa_a_{timestamp}.dump"

    environment = os.environ.copy()
    if url.password:
        environment["PGPASSWORD"] = url.password

    command = [
        pg_dump,
        "--format=custom",
        "--no-owner",
        "--no-privileges",
        "--file",
        str(destination),
        "--host",
        url.host or "localhost",
        "--port",
        str(url.port or 5432),
        "--username",
        url.username or "postgres",
        database,
    ]
    completed = subprocess.run(
        command,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        destination.unlink(missing_ok=True)
        raise RuntimeError(f"pg_dump falló: {completed.stderr.strip()}")

    if destination.stat().st_size == 0:
        destination.unlink(missing_ok=True)
        raise RuntimeError("pg_dump produjo un archivo vacío")

    verification = subprocess.run(
        [pg_restore, "--list", str(destination)],
        capture_output=True,
        text=True,
        check=False,
    )
    if verification.returncode != 0 or not verification.stdout.strip():
        raise RuntimeError(f"pg_restore --list falló: {verification.stderr.strip()}")

    return {
        "status": "PASS",
        "path": str(destination),
        "size_bytes": destination.stat().st_size,
        "sha256": sha256_file(destination),
        "archive_entries": len(verification.stdout.splitlines()),
        "format": "PostgreSQL custom",
    }


if __name__ == "__main__":
    try:
        result = backup_database()
    except Exception as exc:
        print(json.dumps({"status": "ERROR", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2) from exc

    print(json.dumps(result, ensure_ascii=False, indent=2))
