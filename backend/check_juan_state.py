#!/usr/bin/env python3
"""Script to check the current state of supervisor_id 1 (Juan Muñoz)"""

import os
import sys

# Add the current directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.cyr_models import ControlSupervisorComunasZonas

# Get Postgres connection
engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("=== Current state of supervisor_id 1 ===")
entries = db.query(ControlSupervisorComunasZonas).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).order_by(ControlSupervisorComunasZonas.zona_principal, ControlSupervisorComunasZonas.comuna).all()

print(f"Total entries: {len(entries)}")
print()

# Show entries grouped by zona_principal
from collections import defaultdict
entries_by_zona = defaultdict(list)
for entry in entries:
    entries_by_zona[entry.zona_principal].append(entry)

for zona, zona_entries in entries_by_zona.items():
    print(f"Zona '{zona}':")
    for entry in zona_entries:
        print(f"  '{entry.comuna}' (ID: {entry.id}, activo: {entry.activo})")
    print()

# Check for duplicates
print("=== Duplicate Analysis ===")
entries_by_comuna_zona = defaultdict(list)
for entry in entries:
    key = (entry.comuna.lower().strip(), entry.zona_principal.lower().strip())
    entries_by_comuna_zona[key].append(entry)

has_dupes = False
for (comuna, zona), entry_list in entries_by_comuna_zona.items():
    if len(entry_list) > 1:
        has_dupes = True
        print(f"DUPLICATE: '{comuna}' -> '{zona}' ({len(entry_list)} entries)")

if not has_dupes:
    print("✓ No duplicates found!")
else:
    print(f"✗ Found {len([k for k, v in entries_by_comuna_zona.items() if len(v) > 1])} duplicate combinations")

db.close()