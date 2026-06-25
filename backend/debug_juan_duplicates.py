#!/usr/bin/env python3
"""
Debug script to analyze and fix duplicates in ControlSupervisorComunasZonas for Juan Muñoz.

This script helps identify the specific duplicate entries in Juan Muñoz's (supervisor_id = 1)
assignments in the control_supervisor_comunas_zonas table.

Based on the issue description, Juan Muñoz has duplicates for:
- chillan -> chillan
- concepcion -> concepcion  
- los angeles -> losangeles
"""

import os
import sys

# Set up Python path
sys.path.insert(0, '/Users/claud/Desktop/TorreDeControl/backend')

from dotenv import load_dotenv
load_dotenv('.env')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.cyr_models import ControlSupervisorComunasZonas

def check_juan_duplicates():
    """Check for duplicates in Juan Muñoz's assignments (supervisor_id = 1)"""
    print("=" * 70)
    print("DUPLICATES DEBUG SCRIPT - Juan Muñoz (supervisor_id = 1)")
    print("=" * 70)
    print()

    # Connect to database
    engine = create_engine('postgresql://postgres:postgres@localhost:5432/torre_control')
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Get all active entries for Juan Muñoz
        entries = db.query(ControlSupervisorComunasZonas).filter(
            ControlSupervisorComunasZonas.supervisor_id == 1,
            ControlSupervisorComunasZonas.activo == True
        ).order_by(
            ControlSupervisorComunasZonas.zona_principal,
            ControlSupervisorComunasZonas.comuna
        ).all()

        print(f"Total unique entries: {len(entries)}")
        print()

        # Show entries grouped by zona_principal
        from collections import defaultdict
        entries_by_zona = defaultdict(list)
        for entry in entries:
            entries_by_zona[entry.zona_principal].append(entry)

        print("=== ENTRIES BY ZONA ===")
        for zona, zona_entries in entries_by_zona.items():
            print(f"Zona '{zona}':")
            for entry in zona_entries:
                print(f"  - '{entry.comuna}' (ID: {entry.id})")
            print()

        # Find duplicates (same comuna + zona_principal combination)
        print("=== DUPLICATE ANALYSIS ===")
        entries_by_comuna_zona = defaultdict(list)
        for entry in entries:
            key = (entry.comuna.lower().strip(), entry.zona_principal.lower().strip())
            entries_by_comuna_zona[key].append(entry)

        duplicates_found = False
        duplicate_keys = []
        
        for (comuna, zona), entry_list in entries_by_comuna_zona.items():
            if len(entry_list) > 1:
                duplicates_found = True
                duplicate_keys.append((comuna, zona))
                print(f"DUPLICATE FOUND: '{comuna}' -> '{zona}' ({len(entry_list)} entries)")
                for entry in entry_list:
                    print(f"  - ID {entry.id}: '{entry.comuna}' -> '{entry.zona_principal}'")
                print()

        if not duplicates_found:
            print("✓ No duplicates found!")
            return True
        else:
            print(f"✗ Found {len(duplicate_keys)} duplicate combinations")
            print()

        # Query directly from database to see what's in the table
        print("=== DIRECT DATABASE QUERY ===")
        print("All entries in control_supervisor_comunas_zonas for supervisor_id = 1:")
        query = text("""
        SELECT id, comuna, zona_principal, activo
        FROM control_supervisor_comunas_zonas
        WHERE supervisor_id = 1 AND activo = TRUE
        ORDER BY zona_principal, comuna
        """)
        
        for row in db.execute(query):
            print(f"  - ID {row.id}: '{row.comuna}' -> '{row.zona_principal}' (activo: {row.activo})")
        print()

        # Analysis of specific duplicates mentioned in the issue
        print("=== ISSUE-SPECIFIC DUPLICATES ===")
        print("Looking for the specific duplicates mentioned in the issue:")
        
        # Lowercase versions of the issue
        issue_cases = [
            ('chillan', 'chillan'),
            ('concepcion', 'concepcion'),
            ('los angeles', 'los angeles')
        ]
        
        issue_duplicates_found = False
        for comuna_lower, zona_lower in issue_cases:
            # Find actual entries that match this case (case-insensitive)
            matches = []
            for entry in entries:
                if (entry.comuna.lower().strip() == comuna_lower and 
                    entry.zona_principal.lower().strip() == zona_lower):
                    matches.append(entry)
            
            if len(matches) > 1:
                issue_duplicates_found = True
                print(f"✓ ISSUE DUPLICATE: '{comuna_lower}' -> '{zona_lower}' ({len(matches)} entries)")
                for match in matches:
                    print(f"  - ID {match.id}: '{match.comuna}' -> '{match.zona_principal}'")
            else:
                print(f"✗ Not found duplicate: '{comuna_lower}' -> '{zona_lower}' (found {len(matches)})")
            print()

        if issue_duplicates_found:
            print("\n" + "=" * 70)
            print("CONCLUSION: Duplicates exist and need to be fixed")
            print("=" * 70)
            print()
            print("Script created to fix duplicates:")
            print("  1. Keep first occurrence of each duplicate")
            print("  2. Deactivate remaining duplicates")
            print("  3. Commit changes")
            return False
        else:
            print("\n" + "=" * 70)
            print("CONCLUSION: No issue-specific duplicates found")
            print("=" * 70)
            return True

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = check_juan_duplicates()
    if success:
        print("\n✓ Script completed successfully!")
    else:
        print("\n✗ Script completed with issues - duplicates found!")
        sys.exit(1)