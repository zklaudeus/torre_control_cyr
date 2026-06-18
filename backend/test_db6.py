import sys
sys.path.append('c:/Users/claud/Desktop/TorreDeControl/backend')
from app.core.database import SessionLocal
from app.models.cyr_models import ControlBrigadasDiario

db = SessionLocal()
b_coquimbo = db.query(ControlBrigadasDiario).filter(ControlBrigadasDiario.zona == 'Coquimbo').all()
b_iquique = db.query(ControlBrigadasDiario).filter(ControlBrigadasDiario.zona == 'Iquique').all()
b_scruz = db.query(ControlBrigadasDiario).filter(ControlBrigadasDiario.zona == 'Santa Cruz').all()

print(f"Historical brigadas Coquimbo: {len(b_coquimbo)}")
print(f"Historical brigadas Iquique: {len(b_iquique)}")
print(f"Historical brigadas Santa Cruz: {len(b_scruz)}")

if len(b_coquimbo) > 0:
    print(f"Example Coquimbo user: {b_coquimbo[0].usuario}")
