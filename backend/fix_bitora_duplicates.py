#!/usr/bin/env python3
"""Fix duplicates for Juan Muñoz in ControlSupervisorComunasZonas"""

import os
import sys
sys.path.insert(0, os.path.abspath(__file__))

from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.cyr_models import ControlSupervisorComunasZonas

# Get Postgres connection
engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Get current entries
entries = db.query(ControlSupervisorComunasZonas).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).all()

print("Current entries for supervisor_id 1 (Juan Muñoz):")
for entry in entries:
    print(f"  {entry.zona_principal} -> {entry.comuna} (ID: {entry.id})")

print()

# Check for duplicates
from collections import defaultdict
entries_by_key = defaultdict(list)
for entry in entries:
    key = (entry.comuna.lower().strip(), entry.zona_principal.lower().strip())
    entries_by_key[key].append(entry)

print("Duplicate analysis:")
found_duplicates = False
for key, entry_list in entries_by_key.items():
    if len(entry_list) > 1:
        found_duplicates = True
        comuna, zona = key
        print(f"  DUPLICATE: '{comuna}' -> '{zona}' ({len(entry_list)} entries)")

if not found_duplicates:
    print("  No duplicates found!")
else:
    print()
    print("Fixing duplicates...")
    
    # Deactivate all duplicates except the first occurrence
    for key, entry_list in entries_by_key.items():
        if len(entry_list) > 1:
            # Keep the first one, deactivate all others
            for entry in entry_list[1:]:
                entry.activo = False
                db.add(entry)
            print(f"  Fixed: '{key[0]}' -> '{key[1]}'")
    
    db.commit()
    print("  All duplicates fixed!")

# Verify fix
print()
print("Verification after fix:")
final_entries = db.query(ControlSupervisorComunasZonas).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).all()

for entry in final_entries:
    print(f"  {entry.zona_principal} -> {entry.comuna} (ID: {entry.id})")

# Final check for duplicates
unique_keys = set()
remaining_dups = []
for entry in final_entries:
    key = (entry.comuna.lower().strip(), entry.zona_principal.lower().strip())
    if key in unique_keys:
        remaining_dups.append(entry)
    else:
        unique_keys.add(key)

if remaining_dups:
    print(f"\nFAIL: {len(remaining_dups)} duplicates still exist!")
else:
    print(f"\nSUCCESS: {len(final_entries)} unique entries (no duplicates)")

db.close()