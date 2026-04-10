function getDeviceId() {

  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = "DEVICE-" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
}

export default getDeviceId;