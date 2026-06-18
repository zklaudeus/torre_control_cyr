import sys
import os

# Ajustar path para importar módulos de la app
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.core.database import SessionLocal
from app.cleaning_engine.service import procesar_archivos_operacionales
from app.models.cyr_models import ControlBrigadasDiario
from sqlalchemy import insert
import datetime

# Preparar base de datos con algunos registros dummy para la fecha de los excel (2026-06-16)
def prep_db(db):
    fecha = datetime.date(2026, 6, 16)
    
    # Limpiar primero
    db.query(ControlBrigadasDiario).filter(ControlBrigadasDiario.fecha_operacional == fecha).delete()
    
    # Insertar brigadas
    # Según Reporte_Actual, los usuarios son P004985 (Boris Cerro), P004952 (Claudio Escobar), etc. en Concepción
    brigadas = [
        {"fecha_operacional": fecha, "zona": "Concepción", "codigo_sap": "P004985", "usuario": "Boris Cerro", "tipo_brigada": "PXQ", "estado_brigada": "Operativa"},
        {"fecha_operacional": fecha, "zona": "Concepción", "codigo_sap": "P004952", "usuario": "Claudio Escobar", "tipo_brigada": "PXQ", "estado_brigada": "Operativa"},
        {"fecha_operacional": fecha, "zona": "Concepción", "codigo_sap": "P000375", "usuario": "David Guevara", "tipo_brigada": "PXQ", "estado_brigada": "Operativa"},
        {"fecha_operacional": fecha, "zona": "Chillán", "codigo_sap": "P003014", "usuario": "Andres Gatica", "tipo_brigada": "PXQ", "estado_brigada": "Operativa"},
        {"fecha_operacional": fecha, "zona": "Concepción", "codigo_sap": "P004982", "usuario": "Fabian Saavedra", "tipo_brigada": "PXQ", "estado_brigada": "Operativa"},
    ]
    
    db.execute(insert(ControlBrigadasDiario).values(brigadas))
    db.commit()
    print("Base de datos preparada.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        prep_db(db)
        
        # Procesar los dos archivos
        archivos = [
            'C:/Users/claud/Desktop/TorreDeControl/docs/Export - 2026-06-17T083459.874.xlsx',
            'C:/Users/claud/Desktop/TorreDeControl/docs/Export - 2026-06-17T083738.235.xlsx'
        ]
        
        resultado = procesar_archivos_operacionales(db, archivos)
        
        print("RESULTADO DEL PROCESAMIENTO:")
        print(f"OK: {resultado.ok}")
        print(f"Fecha operacional: {resultado.fecha_operacional}")
        print(f"Filas leidas: {resultado.total_filas_leidas}")
        print(f"Filas limpias: {resultado.total_filas_limpias}")
        print(f"Duplicados: {resultado.duplicados_eliminados}")
        print(f"Brigadas calculadas: {resultado.total_resultados_calculados}")
        print(f"Brigadas actualizadas (en BD): {resultado.total_brigadas_actualizadas}")
        print(f"SAP sin match en BD (algunos ejemplos): {resultado.sap_sin_match[:5]}")
        print(f"Errores: {resultado.errores}")
        
        # Verificar BD para Boris Cerro (P004985) y Andres Gatica (P003014)
        boris = db.query(ControlBrigadasDiario).filter_by(codigo_sap='P004985').first()
        andres = db.query(ControlBrigadasDiario).filter_by(codigo_sap='P003014').first()
        
        print("\nVerificación Boris Cerro:")
        if boris:
            print(f"Total cortes: {boris.total_cortes} (Esperado: 5)")
            print(f"Reconexiones: {boris.reconexiones_ejecutadas} (Esperado: 4)")
            print(f"Visita fallida: {boris.visita_fallida} (Esperado: 5)")
            print(f"Corte poste: {boris.corte_en_poste} (Esperado: 2)")
            print(f"Corte empalme: {boris.corte_en_empalme} (Esperado: 3)")
            
        print("\nVerificación Andres Gatica:")
        if andres:
            print(f"Total cortes: {andres.total_cortes} (Esperado: 20)")
            print(f"Reconexiones: {andres.reconexiones_ejecutadas} (Esperado: 12)")
            
        fabian = db.query(ControlBrigadasDiario).filter_by(codigo_sap='P004982').first()
        print("\nVerificación Fabian Saavedra:")
        if fabian:
            print(f"acum_09: {fabian.acum_09} (Esperado: 2)")
            print(f"acum_10: {fabian.acum_10} (Esperado: 6)")
            print(f"acum_11: {fabian.acum_11} (Esperado: 7)")
            print(f"acum_12: {fabian.acum_12} (Esperado: None)")
            print(f"acum_13: {fabian.acum_13} (Esperado: None)")
            print(f"acum_14: {fabian.acum_14} (Esperado: None)")
            
    finally:
        db.close()
