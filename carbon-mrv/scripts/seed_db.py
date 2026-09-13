#!/usr/bin/env python3
"""
Manual Database Seeding Script for Circular Carbon MRV (Frontend Folder Copy)
Directly populates SQLite tables with Clerk test data and demo ecosystem records.
"""

import sys
from pathlib import Path

# Add parent or run main seeder
seeder_path = Path(__file__).resolve().parent.parent.parent / "scripts" / "seed_db.py"
if seeder_path.exists():
    import runpy
    runpy.run_path(str(seeder_path), run_name="__main__")
else:
    print(f"Error: {seeder_path} not found.")
