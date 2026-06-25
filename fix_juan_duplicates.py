import os
import sys

# Add the current directory to the path so we can import from backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models.cyr_models import ControlSupervisorComunasZonas

# Get Postgres connection
engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Get current entries
entries = db.query(ControlSupervisorComunasZonas).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).all()

print("Current entries for supervisor_id 1:")
for entry in entries:
    print(f"  {entry.zona_principal} -> {entry.comuna} (ID: {entry.id})")

# Check for duplicates
from collections import defaultdict
entries_by_key = defaultdict(list)
for entry in entries:
    key = (entry.comuna.lower().strip(), entry.zona_principal.lower().strip())
    entries_by_key[key].append(entry)

print("\nDuplicates found:")
for key, entry_list in entries_by_key.items():
    if len(entry_list) > 1:
        print(f"  '{key[0]}' -> '{key[1]}': {len(entry_list)} entries")

# Fix duplicates
duplicates_to_fix = [(k, v) for k, v in entries_by_key.items() if len(v) > 1]

if duplicates_to_fix:
    print("\nFixing duplicates...")
    for key, entry_list in duplicates_to_fix:
        print(f"  Fixing '{key[0]}' -> '{key[1]}'")
        # Keep first, deactivate others
        for entry in entry_list[1:]:
            entry.activo = False
            db.add(entry)
    
    db.commit()
    print("  Fixed!")
else:
    print("\nNo duplicates found!")

# Verify
db.close()