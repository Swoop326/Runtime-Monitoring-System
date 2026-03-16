import sqlite3

conn = sqlite3.connect("database/licenses.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS licenses (
    license_key TEXT PRIMARY KEY,
    active INTEGER,
    device_id TEXT,
    created_at TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT UNIQUE,
    password TEXT
)
""")

conn.commit()
conn.close()

print("Database initialized.")