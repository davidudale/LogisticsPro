const GEOLOCATION_ERROR_MESSAGES = {
  1: "Location permission was denied. Please allow location access and try again.",
  2: "Your location could not be determined. Check your network or GPS signal.",
  3: "Location request timed out. Please try again.",
};

export const isGeolocationSupported = () =>
  typeof window !== "undefined" && "geolocation" in navigator;

export const normalizeGeolocationPosition = (position) => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
  altitude: position.coords.altitude,
  altitudeAccuracy: position.coords.altitudeAccuracy,
  heading: position.coords.heading,
  speed: position.coords.speed,
  timestamp: position.timestamp,
});

export const createGeolocationError = (error) => ({
  code: error?.code ?? 0,
  message: error?.message || GEOLOCATION_ERROR_MESSAGES[error?.code] || "Unable to fetch location.",
});

export const getCurrentBrowserPosition = (options = {}) =>
  new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject({
        code: -1,
        message: "Geolocation is not supported in this browser.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(normalizeGeolocationPosition(position)),
      (error) => reject(createGeolocationError(error)),
      options,
    );
  });

export const watchBrowserPosition = (onSuccess, onError, options = {}) => {
  if (!isGeolocationSupported()) {
    throw new Error("Geolocation is not supported in this browser.");
  }

  return navigator.geolocation.watchPosition(
    (position) => onSuccess(normalizeGeolocationPosition(position)),
    (error) => onError(createGeolocationError(error)),
    options,
  );
};

export const clearBrowserPositionWatch = (watchId) => {
  if (!isGeolocationSupported() || watchId == null) {
    return;
  }

  navigator.geolocation.clearWatch(watchId);
};

export const getGeolocationPermissionStatus = async () => {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown";
  }

  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state;
  } catch (error) {
    return "unknown";
  }
};
