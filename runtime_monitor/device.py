import socket


def get_device_id():

    device_name = socket.gethostname()

    return device_name