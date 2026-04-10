from database.mongo_connection import users_collection, licenses_collection


# -------------------------
# LICENSE FUNCTIONS
# -------------------------

def create_license(license_key, created_at):

    licenses_collection.insert_one({
        "license_key": license_key,
        "active": False,
        "devices_used": [],
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

def create_user(username, email, password):

    users_collection.insert_one({
        "username": username,
        "email": email,
        "password": password,
        "role": "user"
    })


def get_user(email):

    return users_collection.find_one({"email": email})

def update_devices(license_key, devices):

    licenses_collection.update_one(
        {"license_key": license_key},
        {"$set": {"devices_used": devices}}
    )