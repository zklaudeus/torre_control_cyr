#!/usr/bin/env python3
"""
Fix duplicates in supervisor_bitacora for Juan Muñoz (supervisor_id 1)
Duplicates to fix:
- chillan -> chillan (duplicate)
- concepcion -> concepcion (duplicate)
- los angeles -> losangeles (duplicate)
"""

import os
import sys

# Add the current directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.cyr_models import ControlSupervisorComunasZonas

engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("=== Checking supervisor_id 1 (Juan Muñoz) for duplicates ===")
print()

# Get all entries for supervisor_id 1
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

# Fix duplicates
duplicates_to_fix = [(k, v) for k, v in entries_by_comuna_zona.items() if len(v) > 1]

if duplicates_to_fix:
    print()
    print("=== Fixing Duplicates ===")
    print()
    
    # Deactivate all but the first entry for each duplicate
    for (comuna, zona), entry_list in duplicates_to_fix:
        print(f"Fixing: '{comuna}' -> '{zona}'")
        print(f"  Keeping: ID {entry_list[0].id}")
        
        for entry in entry_list[1:]:
            print(f"  Deactivating: ID {entry.id}")
            entry.activo = False
            db.add(entry)
    
    db.commit()
    print()
    print("✓ All duplicates fixed!")
else:
    print("\nNo duplicates to fix.")

# Verify the fix
print()
print("=== Verification ===")
final_entries = db.query(ControlSupervisorComunasZonas).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).order_by(ControlSupervisorComunasZonas.zona_principal, ControlSupervisorComunasZonas.comuna).all()

print(f"Final entries ({len(final_entries)}):")
for entry in final_entries:
    print(f"  - '{entry.comuna}' -> '{entry.zona_principal}' (ID: {entry.id})")

# Check for remaining duplicates
unique_keys = set()
remaining_dups = []
for entry in final_entries:
    key = (entry.comuna.lower().strip(), entry.zona_principal.lower().strip())
    if key in unique_keys:
        remaining_dups.append(entry)
    else:
        unique_keys.add(key)

if remaining_dups:
    print(f"\n✗ FAILURE: {len(remaining_dups)} duplicates still exist!")
else:
    print(f"\n✓ SUCCESS: {len(final_entries)} unique entries (no duplicates)")

db.close()