import psycopg2

conn = psycopg2.connect(
    host='localhost', port=5433,
    dbname='torre_control_cyr',
    user='postgres', password='admin123'
)
cur = conn.cursor()

# Get Cynthia's supervisor ID
cur.execute("""
    SELECT u.id, s.id as supervisor_id, s.nombre
    FROM control_usuarios u
    JOIN control_supervisores s ON u.supervisor_id = s.id
    WHERE u.usuario = 'cynthia.garrido'
""")
user = cur.fetchone()

if user:
    user_id, sup_id, nombre = user
    print(f"Cynthia's User ID: {user_id}, Supervisor ID: {sup_id}, Nombre: {nombre}")
    
    # Check her assigned comunas/zonas
    cur.execute("""
        SELECT id, comuna, zona_principal
        FROM control_supervisor_comunas_zonas
        WHERE supervisor_id = %s AND activo = true
    """, (sup_id,))
    comunas = cur.fetchall()
    print("\nAssigned Comunas/Zonas:")
    for c in comunas:
        print(f"  ID: {c[0]}, Comuna: {c[1]}, Zona: {c[2]}")
        
    # Check SAP users assigned to her
    cur.execute("""
        SELECT id, codigo_sap, cuenta, comuna_habitual
        FROM control_supervisor_usuarios_sap
        WHERE supervisor_id = %s AND activo = true
    """, (sup_id,))
    sap_users = cur.fetchall()
    print("\nAssigned SAP Users:")
    for u in sap_users:
        print(f"  ID: {u[0]}, SAP: {u[1]}, Cuenta: {u[2]}, Comuna: {u[3]}")
else:
    print("User cynthia.garrido not found.")

conn.close()
