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
from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models.cyr_models import ControlSupervisorComunasZonas

# Get Postgres connection
engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("=== Fixing supervisor_bitacora duplicates for Juan Muñoz ===")
print()

# Get all entries for supervisor_id 1
entries = db.query(ControlSupervisorComunasZonas).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).order_by(ControlSupervisorComunasZonas.zona_principal, ControlSupervisorComunasZonas.comuna).all()

print(f"Current entries ({len(entries)}):")
for entry in entries:
    print(f"  ID {entry.id}: '{entry.comuna}' -> '{entry.zona_principal}'")

print()

# Find duplicates
from collections import defaultdict
entries_by_key = defaultdict(list)
for entry in entries:
    key = (entry.comuna.lower().strip(), entry.zona_principal.lower().strip())
    entries_by_key[key].append(entry)

print("=== DUPLICATES ===")
duplicates_to_fix = {}
for key, entry_list in entries_by_key.items():
    if len(entry_list) > 1:
        comuna, zona = key
        duplicates_to_fix[key] = entry_list
        print(f"  DUPLICATE: '{comuna}' -> '{zona}' ({len(entry_list)} entries)")

if not duplicates_to_fix:
    print("  No duplicates found!")
else:
    print()
    print("=== FIXING ===")
    print()
    
    # Deactivate all but the first entry for each duplicate
    for (comuna, zona), entry_list in duplicates_to_fix.items():
        print(f"Fixing: '{comuna}' -> '{zona}'")
        print(f"  Keeping: ID {entry_list[0].id}")
        
        for entry in entry_list[1:]:
            print(f"  Deactivating: ID {entry.id}")
            entry.activo = False
            db.add(entry)
    
    db.commit()
    print()
    print("Duplicates fixed successfully!")

# Verify the fix
print()
print("=== VERIFICATION ===")
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
    print(f"\nFAILURE: {len(remaining_dups)} duplicates still exist!")
else:
    print(f"\nSUCCESS: {len(final_entries)} unique entries")

# Expected unique entries
expected_unique = 10 + 2 + 4  # Concepción, Los Ángeles, Chillán

print(f"\nExpected unique entries: {expected_unique}")
if len(final_entries) == expected_unique:
    print("✓ CORRECT: No duplicates, expected number of entries!")
else:
    print(f"⚠ WARNING: Expected {expected_unique} entries, got {len(final_entries)}")

db.close()