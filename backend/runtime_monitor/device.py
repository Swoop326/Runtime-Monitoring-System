import socket
import uuid

def get_device_id(force_device=None):

    if force_device:
        return force_device

    hostname = socket.gethostname()

    mac = uuid.getnode()
    mac_address = ':'.join(('%012X' % mac)[i:i+2] for i in range(0, 12, 2))

    device_id = f"{hostname}-{mac_address}"

    return device_id