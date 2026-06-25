#!/usr/bin/env python
"""
Simple script to fix duplicates in Juan Muñoz's supervisor assignments.

Based on the issue, Juan Muñoz (supervisor_id = 1) has these duplicates:
- chillan -> chillan (duplicate)
- concepcion -> concepcion (duplicate)
- los angeles -> losangeles (duplicate)

The script:
1. Checks current state
2. Identifies duplicates
3. Fixes them by deactivating duplicates
4. Verifies the fix
"""

import os
import sys

# Set up Python path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models.cyr_models import ControlSupervisorComunasZonas

# Connect to database
engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("=== Juan Muñoz Supervisor Bitacora Fix ===")
print(f"Total entries for supervisor_id 1: {db.query(ControlSupervisorComunasZonas).filter(ControlSupervisorComunasZonas.supervisor_id == 1, ControlSupervisorComunasZonas.activo == True).count()}")
print()

# Get all entries for Juan Muñoz
entries = db.query(ControlSupervisorComunasZonas).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).all()

# Show current entries
print("Current entries:")
for entry in entries:
    print(f"  ID {entry.id}: '{entry.comuna}' -> '{entry.zona_principal}'")

# Find duplicates
from collections import defaultdict
entries_by_key = defaultdict(list)
for entry in entries:
    key = (entry.comuna.lower().strip(), entry.zona_principal.lower().strip())
    entries_by_key[key].append(entry)

print("\nDuplicate analysis:")
duplicates = []
for key, entry_list in entries_by_key.items():
    if len(entry_list) > 1:
        duplicates.extend(entry_list)
        print(f"  DUPLICATE '{key[0]}' -> '{key[1]}': {len(entry_list)} entries")

if duplicates:
    print(f"\nFixing {len(duplicates)} duplicate entries...")
    
    # Deactivate all duplicates except first occurrence
    for key, entry_list in entries_by_key.items():
        if len(entry_list) > 1:
            # Keep first entry, deactivate others
            for entry in entry_list[1:]:
                entry.activo = False
                db.add(entry)
                print(f"  Deactivating: ID {entry.id} ('{entry.comuna}' -> '{entry.zona_principal}')")
    
    db.commit()
    print("\n✓ Duplicates fixed successfully!")
    
    # Verify
    print("\nVerification:")
    final_entries = db.query(ControlSupervisorComunasZonas).filter(
        ControlSupervisorComunasZonas.supervisor_id == 1,
        ControlSupervisorComunasZonas.activo == True
    ).all()
    
    print(f"Final count: {len(final_entries)}")
    print("\nFinal entries:")
    for entry in final_entries:
        print(f"  '{entry.comuna}' -> '{entry.zona_principal}' (ID: {entry.id})")
else:
    print("\n✓ No duplicates found!")

db.close()