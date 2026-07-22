import sqlite3
import os
import sys
import json

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from werkzeug.security import generate_password_hash
from config import Config, BASE_DIR


DB_PATH = os.path.join(BASE_DIR, 'smart_waste.db')

def get_db_connection():
    """Connect to SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables and default admin/worker users."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            phone TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Workers Profile Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            zone TEXT DEFAULT 'Central District',
            active_tasks INTEGER DEFAULT 0,
            completed_tasks INTEGER DEFAULT 0
        )
    ''')

    # Waste Reports Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            user_name TEXT NOT NULL,
            user_phone TEXT,
            waste_type TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            latitude REAL,
            longitude REAL,
            address TEXT,
            status TEXT DEFAULT 'Pending',
            worker_id INTEGER,
            worker_name TEXT,
            before_image TEXT,
            after_image TEXT,
            worker_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (worker_id) REFERENCES users (id)
        )
    ''')

    conn.commit()
    seed_database(conn)
    conn.close()

def seed_database(conn):
    """Seed initial demo accounts and sample reports if database is empty."""
    cursor = conn.cursor()

    # Check if admin exists
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]

    if count == 0:
        # Default Passwords
        admin_pw = generate_password_hash("admin123")
        worker_pw = generate_password_hash("worker123")
        user_pw = generate_password_hash("user123")

        # Insert Admin
        cursor.execute('''
            INSERT INTO users (name, email, password, role, phone, address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ("SmartCity Admin", "admin@smartcity.gov", admin_pw, "admin", "+1-800-SMART-CITY", "City Hall, Sector 4"))
        admin_id = cursor.lastrowid

        # Insert Workers
        cursor.execute('''
            INSERT INTO users (name, email, password, role, phone, address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ("John Sanitation Worker", "worker@smartcity.gov", worker_pw, "worker", "+1-555-0192", "Sanitation Depot A"))
        worker1_user_id = cursor.lastrowid

        cursor.execute('''
            INSERT INTO users (name, email, password, role, phone, address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ("Maria Eco Collector", "maria@smartcity.gov", worker_pw, "worker", "+1-555-0198", "Sanitation Depot B"))
        worker2_user_id = cursor.lastrowid

        # Add to workers table
        cursor.execute('''
            INSERT INTO workers (user_id, name, email, phone, zone, active_tasks, completed_tasks)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (worker1_user_id, "John Sanitation Worker", "worker@smartcity.gov", "+1-555-0192", "North Zone", 1, 12))

        cursor.execute('''
            INSERT INTO workers (user_id, name, email, phone, zone, active_tasks, completed_tasks)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (worker2_user_id, "Maria Eco Collector", "maria@smartcity.gov", "+1-555-0198", "South Zone", 1, 8))

        # Insert Standard User
        cursor.execute('''
            INSERT INTO users (name, email, password, role, phone, address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ("Alex Citizen", "user@example.com", user_pw, "user", "+1-555-0144", "102 Pine Street, Green Park"))
        user_id = cursor.lastrowid

        # Sample Waste Reports
        sample_reports = [
            (
                user_id, "Alex Citizen", "+1-555-0144", "Organic Waste",
                "Overflowing organic waste bin near central market entrance.",
                "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
                28.6139, 77.2090, "Central Market Square, Sector 3",
                "Assigned", worker1_user_id, "John Sanitation Worker",
                "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
                None, "Dispatched team to collect organic bin.", "2026-07-20 09:30:00"
            ),
            (
                user_id, "Alex Citizen", "+1-555-0144", "E-Waste",
                "Discarded old computer monitor and batteries on pavement.",
                "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80",
                28.6210, 77.2150, "Oak Avenue near IT Park",
                "Pending", None, None,
                None, None, None, "2026-07-21 14:15:00"
            ),
            (
                user_id, "Alex Citizen", "+1-555-0144", "Recyclable Plastic",
                "Plastic bottles and cardboard pile outside Community Center.",
                "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
                28.6080, 77.2010, "Community Park Entrance, Gate 2",
                "Completed", worker2_user_id, "Maria Eco Collector",
                "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
                "Area cleaned and plastic sent to recycling facility.", "2026-07-19 11:00:00"
            ),
            (
                user_id, "Alex Citizen", "+1-555-0144", "Hazardous Waste",
                "Chemical paint cans left unattended by building construction site.",
                "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80",
                28.6180, 77.2220, "Industrial Complex, Block B",
                "In Progress", worker1_user_id, "John Sanitation Worker",
                "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80",
                None, "Containment team on site securing hazardous materials.", "2026-07-22 08:45:00"
            )
        ]

        for rep in sample_reports:
            cursor.execute('''
                INSERT INTO reports (
                    user_id, user_name, user_phone, waste_type, description, image_url,
                    latitude, longitude, address, status, worker_id, worker_name,
                    before_image, after_image, worker_notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', rep)

        conn.commit()

if __name__ == '__main__':
    init_db()
    print("Database initialized and seeded successfully!")
