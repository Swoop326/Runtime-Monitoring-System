import os
from runtime_monitor.config import LOCK_FILE


def check_session():

    if os.path.exists(LOCK_FILE):
        return True

    return False


def create_session():

    with open(LOCK_FILE, "w") as file:
        file.write("ACTIVE")


def remove_session():

    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)