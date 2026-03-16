import time
import threading

from runtime_monitor.logger import log_event
from runtime_monitor.device import get_device_id
from runtime_monitor.session import check_session, create_session, remove_session
from runtime_monitor.config import HEARTBEAT_INTERVAL

start_time = None
device_id = None


# Heartbeat function
def heartbeat():

    while True:
        time.sleep(HEARTBEAT_INTERVAL)
        log_event("HEARTBEAT", device=device_id)


def start_monitoring():

    global start_time
    global device_id

    # check if another session exists
    if check_session():
        print("Another session already running")
        exit()

    # create new session
    create_session()

    # record start time
    start_time = time.time()

    # detect device
    device_id = get_device_id()

    # log session start
    log_event("SESSION_START", device=device_id)

    print("Runtime Monitoring Started")

    # start heartbeat thread
    heartbeat_thread = threading.Thread(target=heartbeat, daemon=True)
    heartbeat_thread.start()


def record_event(event):

    log_event(event, device=device_id)


def stop_monitoring():

    global start_time

    end_time = time.time()

    duration = int(end_time - start_time)

    log_event("SESSION_END", device=device_id, duration=duration)

    remove_session()

    print("Monitoring Stopped")