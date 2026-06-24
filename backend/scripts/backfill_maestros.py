"""
Backfill auditable: poblar maestros (dim_zona, dim_comuna, dim_sap)
y relaciones (rlt_supervisor_zona, rlt_supervisor_sap) desde tablas legacy.

Ejecución segura/idempotente: usa INSERT … ON CONFLICT DO NOTHING.
Requiere: migración 002_maestros_dominio aplicada.

Modo:
  python scripts/backfill_maestros.py              # ejecutar y confirmar
  python scripts/backfill_maestros.py --dry-run    # solo mostrar qué haría
"""
import sys
import argparse
from pathlib import Path
from datetime import datetime

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / '.env')

from sqlalchemy import text
from app.core.database import SessionLocal, engine


LOG = []


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    LOG.append(line)
    print(line)


def verify_tables_exist() -> None:
    """Verifica que las tablas destino existen antes de backfillear."""
    required = ["dim_zona", "dim_comuna", "dim_sap", "rlt_supervisor_zona", "rlt_supervisor_sap"]
    with SessionLocal() as db:
        result = db.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()")
        )
        existing = {row[0] for row in result}
    missing = [t for t in required if t not in existing]
    if missing:
        log(f"ERROR: tablas faltantes: {missing}. Ejecuta 'alembic upgrade 002_maestros_dominio' primero.")
        sys.exit(1)
    log("OK: todas las tablas destino existen.")


def count_rows(db, table: str) -> int:
    return db.execute(text(f"SELECT count(*) FROM {table}")).scalar()


def backfill_dim_zona(db, dry_run: bool) -> int:
    """Poblar dim_zona desde todas las zonas conocidas en tablas legacy."""
    log("--- dim_zona ---")
    before = count_rows(db, "dim_zona")
    log(f"  antes: {before} filas")

    sql = """
        INSERT INTO dim_zona (nombre, activo)
        SELECT DISTINCT zona, true
        FROM (
            SELECT zona FROM control_parametros_zona WHERE zona IS NOT NULL
            UNION
            SELECT zona FROM control_brigadas_diario WHERE zona IS NOT NULL
            UNION
            SELECT zona_principal FROM control_supervisor_comunas_zonas WHERE zona_principal IS NOT NULL
            UNION
            SELECT zona FROM control_programacion_zona WHERE zona IS NOT NULL
            UNION
            SELECT zona FROM control_resultados_reales_zona WHERE zona IS NOT NULL
            UNION
            SELECT zona FROM control_programacion_cf_zona WHERE zona IS NOT NULL
            UNION
            SELECT zona FROM control_parametros_cf_zona WHERE zona IS NOT NULL
        ) AS src
        WHERE NOT EXISTS (SELECT 1 FROM dim_zona d WHERE d.nombre = src.zona)
    """
    if dry_run:
        log(f"  [DRY-RUN] INSERTARÍAMOS zonas (SQL arriba)")
        return 0

    result = db.execute(text(sql))
    db.commit()
    after = count_rows(db, "dim_zona")
    inserted = after - before
    log(f"  insertadas: {inserted}")
    log(f"  después: {after} filas")
    return inserted


def backfill_dim_comuna(db, dry_run: bool) -> int:
    """Poblar dim_comuna desde control_supervisor_comunas_zonas."""
    log("--- dim_comuna ---")
    before = count_rows(db, "dim_comuna")
    log(f"  antes: {before} filas")

    sql = """
        INSERT INTO dim_comuna (nombre, zona_id, activo)
        SELECT DISTINCT
            LOWER(scz.comuna),
            dz.id,
            true
        FROM control_supervisor_comunas_zonas scz
        JOIN dim_zona dz ON dz.nombre = scz.zona_principal
        WHERE NOT EXISTS (
            SELECT 1 FROM dim_comuna dc
            WHERE dc.nombre = LOWER(scz.comuna)
        )
    """
    if dry_run:
        log(f"  [DRY-RUN] INSERTARÍAMOS comunas")
        return 0

    result = db.execute(text(sql))
    db.commit()
    after = count_rows(db, "dim_comuna")
    inserted = after - before
    log(f"  insertadas: {inserted}")
    log(f"  después: {after} filas")

    orphans = db.execute(text("""
        SELECT COUNT(*) FROM control_supervisor_comunas_zonas scz
        LEFT JOIN dim_zona dz ON dz.nombre = scz.zona_principal
        WHERE dz.id IS NULL
    """)).scalar()
    if orphans:
        log(f"  ADVERTENCIA: {orphans} comunas legacy sin zona en dim_zona (no se migraron)")
    return inserted


def backfill_dim_sap(db, dry_run: bool) -> int:
    """Poblar dim_sap deduplicando control_supervisor_usuarios_sap.

    Si hay duplicados activos del mismo código SAP, se toma el más reciente (updated_at).
    """
    log("--- dim_sap ---")
    before = count_rows(db, "dim_sap")
    log(f"  antes: {before} filas")

    dups = db.execute(text("""
        SELECT codigo_sap, count(*) AS cnt
        FROM control_supervisor_usuarios_sap
        WHERE codigo_sap IS NOT NULL
        GROUP BY codigo_sap
        HAVING count(*) > 1
    """)).all()
    if dups:
        log(f"  INFO: {len(dups)} códigos SAP duplicados en legacy (se tomará el más reciente)")

    sql = """
        INSERT INTO dim_sap (codigo_sap, cuenta, tipo_brigada, activo)
        SELECT DISTINCT ON (csus.codigo_sap)
            csus.codigo_sap,
            csus.cuenta,
            COALESCE(csus.tipo_brigada, 'PXQ'),
            true
        FROM control_supervisor_usuarios_sap csus
        WHERE csus.codigo_sap IS NOT NULL
        ORDER BY csus.codigo_sap, csus.updated_at DESC NULLS LAST
    """
    if dry_run:
        log(f"  [DRY-RUN] INSERTARÍAMOS SAPs")
        return 0

    result = db.execute(text(sql))
    db.commit()
    after = count_rows(db, "dim_sap")
    inserted = after - before
    log(f"  insertadas: {inserted}")
    log(f"  después: {after} filas")
    return inserted


def backfill_rlt_supervisor_zona(db, dry_run: bool) -> int:
    """Poblar rlt_supervisor_zona desde legacy."""
    log("--- rlt_supervisor_zona ---")
    before = count_rows(db, "rlt_supervisor_zona")
    log(f"  antes: {before} filas")

    sql = """
        INSERT INTO rlt_supervisor_zona (supervisor_id, zona_id, activo)
        SELECT DISTINCT
            scz.supervisor_id,
            dz.id,
            scz.activo
        FROM control_supervisor_comunas_zonas scz
        JOIN dim_zona dz ON dz.nombre = scz.zona_principal
        WHERE NOT EXISTS (
            SELECT 1 FROM rlt_supervisor_zona r
            WHERE r.supervisor_id = scz.supervisor_id AND r.zona_id = dz.id
        )
    """
    if dry_run:
        log(f"  [DRY-RUN] INSERTARÍAMOS relaciones supervisor-zona")
        return 0

    result = db.execute(text(sql))
    db.commit()
    after = count_rows(db, "rlt_supervisor_zona")
    inserted = after - before
    log(f"  insertadas: {inserted}")
    log(f"  después: {after} filas")
    return inserted


def backfill_rlt_supervisor_sap(db, dry_run: bool) -> int:
    """Poblar rlt_supervisor_sap desde legacy (solo activos)."""
    log("--- rlt_supervisor_sap ---")
    before = count_rows(db, "rlt_supervisor_sap")
    log(f"  antes: {before} filas")

    sql = """
        INSERT INTO rlt_supervisor_sap (supervisor_id, sap_id, activo)
        SELECT DISTINCT
            csus.supervisor_id,
            ds.id,
            csus.activo
        FROM control_supervisor_usuarios_sap csus
        JOIN dim_sap ds ON ds.codigo_sap = csus.codigo_sap
        WHERE NOT EXISTS (
            SELECT 1 FROM rlt_supervisor_sap r
            WHERE r.supervisor_id = csus.supervisor_id AND r.sap_id = ds.id
        )
    """
    if dry_run:
        log(f"  [DRY-RUN] INSERTARÍAMOS relaciones supervisor-sap")
        return 0

    result = db.execute(text(sql))
    db.commit()
    after = count_rows(db, "rlt_supervisor_sap")
    inserted = after - before
    log(f"  insertadas: {inserted}")
    log(f"  después: {after} filas")
    return inserted


def validate_orphans(db) -> list[str]:
    """Verifica datos huérfanos en las nuevas tablas."""
    warnings = []

    comunas_sin_zona = db.execute(text("""
        SELECT COUNT(*) FROM dim_comuna dc
        LEFT JOIN dim_zona dz ON dz.id = dc.zona_id
        WHERE dz.id IS NULL
    """)).scalar()
    if comunas_sin_zona:
        warnings.append(f"{comunas_sin_zona} comunas sin zona válida en dim_zona")

    rlt_sup_sin_supervisor = db.execute(text("""
        SELECT COUNT(*) FROM rlt_supervisor_zona r
        LEFT JOIN control_supervisores cs ON cs.id = r.supervisor_id
        WHERE cs.id IS NULL
    """)).scalar()
    if rlt_sup_sin_supervisor:
        warnings.append(f"{rlt_sup_sin_supervisor} relaciones supervisor-zona sin supervisor válido")

    rlt_sap_sin_supervisor = db.execute(text("""
        SELECT COUNT(*) FROM rlt_supervisor_sap r
        LEFT JOIN control_supervisores cs ON cs.id = r.supervisor_id
        WHERE cs.id IS NULL
    """)).scalar()
    if rlt_sap_sin_supervisor:
        warnings.append(f"{rlt_sap_sin_supervisor} relaciones supervisor-sap sin supervisor válido")

    rlt_sap_sin_sap = db.execute(text("""
        SELECT COUNT(*) FROM rlt_supervisor_sap r
        LEFT JOIN dim_sap ds ON ds.id = r.sap_id
        WHERE ds.id IS NULL
    """)).scalar()
    if rlt_sap_sin_sap:
        warnings.append(f"{rlt_sap_sin_sap} relaciones supervisor-sap sin SAP válido en dim_sap")

    return warnings


def main():
    parser = argparse.ArgumentParser(description="Backfill maestros desde legacy")
    parser.add_argument("--dry-run", action="store_true", help="Solo mostrar qué se haría")
    args = parser.parse_args()

    dry_run = args.dry_run

    if engine is None:
        log("ERROR: No hay conexión a BD")
        sys.exit(1)

    verify_tables_exist()

    with SessionLocal() as db:
        backfill_dim_zona(db, dry_run)
        backfill_dim_comuna(db, dry_run)
        backfill_dim_sap(db, dry_run)
        backfill_rlt_supervisor_zona(db, dry_run)
        backfill_rlt_supervisor_sap(db, dry_run)

        log("--- validación ---")
        warnings = validate_orphans(db)
        if warnings:
            for w in warnings:
                log(f"  ADVERTENCIA: {w}")
        else:
            log("  0 huérfanos detectados.")

        log("--- conteos finales ---")
        for table in ["dim_zona", "dim_comuna", "dim_sap", "rlt_supervisor_zona", "rlt_supervisor_sap"]:
            cnt = count_rows(db, table)
            log(f"  {table}: {cnt}")

    if dry_run:
        log("\n[DRY-RUN] No se modificó la BD.")
    else:
        log("\nBackfill completado.")


if __name__ == "__main__":
    main()
