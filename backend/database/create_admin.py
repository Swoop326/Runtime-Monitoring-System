import sqlite3

conn = sqlite3.connect("users.db")
cursor = conn.cursor()

cursor.execute("""
INSERT INTO users (username,email,password,role)
VALUES ('admin','admin@system.com','admin123','admin')
""")

conn.commit()
conn.close()

print("Admin user created")