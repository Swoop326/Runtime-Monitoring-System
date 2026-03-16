import sqlite3

DB_NAME = "database/licenses.db"


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


# -------------------------
# LICENSE FUNCTIONS
# -------------------------

def create_license(license_key, created_at):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO licenses (license_key, active, device_id, created_at)
    VALUES (?, ?, ?, ?)
    """, (license_key, 0, None, created_at))

    conn.commit()
    conn.close()


def get_license(license_key):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM licenses WHERE license_key=?", (license_key,))
    row = cursor.fetchone()

    conn.close()
    return row


def activate_license_db(license_key, device_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE licenses
    SET active=1, device_id=?
    WHERE license_key=?
    """, (device_id, license_key))

    conn.commit()
    conn.close()


# -------------------------
# USER FUNCTIONS
# -------------------------

def create_user(username, email, password):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO users (username, email, password)
    VALUES (?, ?, ?)
    """, (username, email, password))

    conn.commit()
    conn.close()


def get_user(email):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email=?", (email,))
    user = cursor.fetchone()

    conn.close()
    return user