import hashlib
import os
import binascii
import datetime

from database.mongo_connection import users_collection, licenses_collection


# -------------------------
# LICENSE FUNCTIONS
# -------------------------

def create_license(license_key, created_at):

    licenses_collection.insert_one({
        "license_key": license_key,
        "active": False,
        "devices_used": [],
        # per-device info mapping: device_id -> last known geo/location dict
        "devices_info": {},
        "created_at": created_at
    })


def get_license(license_key):

    return licenses_collection.find_one({"license_key": license_key})


def activate_license_db(license_key, device_id):

    license_data = get_license(license_key)

    if not license_data:
        return False

    devices = license_data.get("devices_used", [])

    if device_id not in devices:
        devices.append(device_id)

    licenses_collection.update_one(
        {"license_key": license_key},
        {
            "$set": {
                "active": True,
                "devices_used": devices
            }
        }
    )

    return True


# -------------------------
# USER FUNCTIONS
# -------------------------

def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{binascii.hexlify(salt).decode('utf-8')}${binascii.hexlify(hashed).decode('utf-8')}"


def _verify_password(password: str, stored_password: str) -> bool:
    if "$" not in stored_password:
        return password == stored_password

    try:
        salt, hashed = stored_password.split("$")
        salt = binascii.unhexlify(salt.encode("utf-8"))
        expected_hash = binascii.unhexlify(hashed.encode("utf-8"))
        tested_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return tested_hash == expected_hash
    except Exception:
        return False


def create_user(username, email, password):

    existing_user = users_collection.find_one({"$or": [{"email": email}, {"username": username}]})
    if existing_user:
        return False

    users_collection.insert_one({
        "username": username,
        "email": email,
        "password": _hash_password(password),
        "role": "user",
        "login_timestamps": []
    })
    return True


def get_user(email):

    return users_collection.find_one({"email": email})


def verify_user_password(email, password):
    user = get_user(email)
    if not user:
        return False

    if _verify_password(password, user["password"]):
        if "$" not in user["password"]:
            users_collection.update_one(
                {"email": email},
                {"$set": {"password": _hash_password(password)}}
            )
        return True

    return False


def add_login_timestamp(email):
    users_collection.update_one(
        {"email": email},
        {"$push": {"login_timestamps": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}}
    )


def update_devices(license_key, devices):

    licenses_collection.update_one(
        {"license_key": license_key},
        {"$set": {"devices_used": devices}}
    )


def update_device_location(license_key, device_id, geo_location):
    """Store last known geo/location for a specific device under devices_info."""
    try:
        # Use dot notation to set nested field for the device id key
        field = f"devices_info.{device_id}"
        licenses_collection.update_one(
            {"license_key": license_key},
            {"$set": {field: geo_location}}
        )
        return True
    except Exception:
        return False