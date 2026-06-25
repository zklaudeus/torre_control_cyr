cd backend && python -c "
from dotenv import load_dotenv
load_dotenv('.env')
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.cyr_models import ControlSupervisorComunasZonas, ControlSupervisores

engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Check what supervisor_id 1 actually is
supervisor = db.query(ControlSupervisores).filter(ControlSupervisores.id == 1).first()
print(f'Supervisor ID 1: {supervisor.id} - {supervisor.nombre}')

# Get ALL assignments for Juan Muñoz (supervisor_id should be his supervisor_id)
# Juan Muñoz has supervisor_id=1
comunas = db.query(ControlSupervisorComunasZonas.comuna, ControlSupervisorComunasZonas.zona_principal).filter(
    ControlSupervisorComunasZonas.supervisor_id == 1,
    ControlSupervisorComunasZonas.activo == True
).all()

print()
print('Current assignments:')
for comuna, zona in comunas:
    print(f'  - comuna: \"{comuna}\", zona_principal: \"{zona}\"')
"