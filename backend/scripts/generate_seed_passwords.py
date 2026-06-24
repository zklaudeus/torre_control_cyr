import json
import secrets
from pathlib import Path

SECRETS_DIR = Path(__file__).resolve().parents[2] / ".secrets"
SECRETS_FILE = SECRETS_DIR / "seed_passwords.json"

USERS = [
    "admin",
    "claudio",
    "juan.munoz",
    "jose.masso",
    "nicolas.farias",
    "eduardo.beltran",
    "cynthia.garrido",
    "gerencia",
]

def main():
    SECRETS_DIR.mkdir(parents=True, exist_ok=True)

    if SECRETS_FILE.exists():
        with open(SECRETS_FILE) as f:
            existing = json.load(f)
    else:
        existing = {}

    for user in USERS:
        if user not in existing:
            existing[user] = secrets.token_urlsafe(16)

    with open(SECRETS_FILE, "w") as f:
        json.dump(existing, f, indent=2)
        f.write("\n")

    print(f"Credenciales guardadas en {SECRETS_FILE}")
    print("¡NO COMPARTAS ESTE ARCHIVO! Está en .gitignore.")

if __name__ == "__main__":
    main()
