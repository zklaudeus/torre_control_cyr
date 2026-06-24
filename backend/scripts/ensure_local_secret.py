"""Genera o rota SECRET_KEY en backend/.env sin imprimir su valor."""

from __future__ import annotations

import json
import secrets
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_ROOT / ".env"
INSECURE_VALUES = {
    "",
    "super-secret-key-torre-cyr-eisesa-2026",
    "change-me",
}


def ensure_secret() -> dict[str, object]:
    lines = ENV_FILE.read_text(encoding="utf-8").splitlines() if ENV_FILE.exists() else []
    secret_index: int | None = None
    current_value = ""

    for index, line in enumerate(lines):
        if line.startswith("SECRET_KEY="):
            secret_index = index
            current_value = line.partition("=")[2].strip()
            break

    must_rotate = current_value in INSECURE_VALUES or len(current_value) < 32
    if must_rotate:
        replacement = f"SECRET_KEY={secrets.token_urlsafe(48)}"
        if secret_index is None:
            lines.append(replacement)
        else:
            lines[secret_index] = replacement
        ENV_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")

    return {
        "status": "PASS",
        "env_file": str(ENV_FILE),
        "secret_rotated": must_rotate,
        "secret_value_printed": False,
    }


if __name__ == "__main__":
    print(json.dumps(ensure_secret(), ensure_ascii=False, indent=2))
