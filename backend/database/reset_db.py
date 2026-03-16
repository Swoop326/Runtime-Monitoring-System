import sqlite3
import os

DB_PATH = "database/licenses.db"

# Remove existing database
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

print("Old database removed.")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Create licenses table
cursor.execute("""
CREATE TABLE licenses (
    license_key TEXT PRIMARY KEY,
    active INTEGER,
    device_id TEXT,
    created_at TEXT
)
""")

# Create users table
cursor.execute("""
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
)
""")

# Create default admin
cursor.execute("""
INSERT INTO users (username, email, password, role)
VALUES ('admin', 'admin@system.com', 'admin123', 'admin')
""")

conn.commit()
conn.close()

print("Database initialized.")
print("Admin account created.")