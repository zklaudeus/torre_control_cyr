"""
Inventario completo del esquema real desde la BD.
Solo lectura. Ejecutar antes de la migración Stage 2.
"""
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / '.env')

from sqlalchemy import inspect, text
from app.core.database import engine


def run():
    if engine is None:
        raise RuntimeError("No hay conexión a BD")

    with engine.connect() as conn:
        inspector = inspect(conn)

        tables = inspector.get_table_names()
        tables.sort()

        inventory = {
            "database": str(engine.url).split("@")[1] if "@" in str(engine.url) else str(engine.url),
            "total_tables": len(tables),
            "tables": {},
        }

        for table_name in tables:
            cols = inspector.get_columns(table_name)
            pk = inspector.get_pk_constraint(table_name)
            fks = inspector.get_foreign_keys(table_name)
            indexes = inspector.get_indexes(table_name)
            unique_constraints = inspector.get_unique_constraints(table_name)
            try:
                check_constraints = inspector.get_check_constraint(table_name)
            except Exception:
                check_constraints = []

            row_result = conn.execute(text(f"SELECT count(*) FROM {table_name}"))
            row_count = row_result.scalar()

            col_info = []
            for c in cols:
                col_info.append({
                    "name": c["name"],
                    "type": str(c["type"]),
                    "nullable": c.get("nullable", True),
                    "default": str(c.get("default", "")) if c.get("default") is not None else None,
                    "primary_key": c["name"] in (pk.get("constrained_columns", [])),
                })

            inventory["tables"][table_name] = {
                "columns": col_info,
                "row_count": row_count,
                "primary_key": pk.get("constrained_columns", []),
                "foreign_keys": [
                    {
                        "columns": fk["constrained_columns"],
                        "referred_table": fk["referred_table"],
                        "referred_columns": fk["referred_columns"],
                    }
                    for fk in fks
                ],
                "indexes": [
                    {
                        "name": idx["name"],
                        "columns": idx["column_names"],
                        "unique": idx.get("unique", False),
                    }
                    for idx in indexes
                ],
                "unique_constraints": [
                    {
                        "name": uc["name"],
                        "columns": uc["column_names"],
                    }
                    for uc in unique_constraints
                ],
                "check_constraints": [
                    {
                        "name": cc["name"],
                        "sqltext": str(cc.get("sqltext", "")),
                    }
                    for cc in check_constraints
                ],
            }

    return inventory


if __name__ == "__main__":
    try:
        inv = run()
        output_path = BACKEND_DIR.parent / ".backups" / "schema_inventory.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(inv, f, ensure_ascii=False, indent=2)
        print(f"Inventario guardado en {output_path}")
        print(f"Tablas: {inv['total_tables']}")
        for tname, tinfo in sorted(inv["tables"].items()):
            print(f"  {tname:45s} {tinfo['row_count']:>6d} filas  {len(tinfo['columns']):>2d} cols")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
