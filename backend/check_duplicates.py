#!/usr/bin/env python
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.cyr_models import ControlSupervisorComunasZonas

engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print('=== Checking for duplicates in supervisor_id 1 ===')
print()

for zona in ['Chillán', 'Concepción', 'Los Ángeles']:
    print(f'Zona: {zona}')
    entries = db.query(ControlSupervisorComunasZonas).filter(
        ControlSupervisorComunasZonas.supervisor_id == 1,
        ControlSupervisorComunasZonas.zona_principal == zona,
        ControlSupervisorComunasZonas.activo == True
    ).all()
    
    for entry in entries:
        print(f'  comuna: {entry.comuna}, zona_principal: {entry.zona_principal} (id: {entry.id})')
    
    if len(entries) > 1:
        print(f'  DUPLICATE FOUND: {len(entries)} entries with comuna: "{entries[0].comuna}", zona_principal: "{zona}"')
    else:
        print(f'  No duplicates: {len(entries)} entries')
    print()

db.close()