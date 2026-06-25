import sys
import os
sys.path.insert(0, os.path.join(os.getcwd(), '..'))

from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.cyr_models import ControlSupervisorComunasZonas

engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Check for duplicates
comuna_groups = db.query(ControlSupervisorComunasZonas.comuna, ControlSupervisorComunasZonas.zona_principal, ControlSupervisorComunasZonas.id).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).all()

print('All current assignments:')
for comuna, zona, id in comuna_groups:
    print(f'  ID {id}: comuna: "{comuna}", zona_principal: "{zona}"')

from collections import defaultdict
duplicate_map = defaultdict(list)
for comuna, zona, id in comuna_groups:
    duplicate_map[(comuna, zona)].append((id, comuna, zona))

print()
print('DUPLICATES FOUND:')
has_duplicates = False
for (comuna, zona), ids in duplicate_map.items():
    if len(ids) > 1:
        has_duplicates = True
        print(f'  comuna: "{comuna}", zona_principal: "{zona}" (IDs: {[i[0] for i in ids]})')

if not has_duplicates:
    print('  No duplicates found')

db.close()