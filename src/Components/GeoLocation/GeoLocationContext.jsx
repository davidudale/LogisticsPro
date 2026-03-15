import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearBrowserPositionWatch,
  createGeolocationError,
  getCurrentBrowserPosition,
  getGeolocationPermissionStatus,
  isGeolocationSupported,
  watchBrowserPosition,
} from "../../Services/geolocation.js";

const GeoLocationContext = createContext(null);

const DEFAULT_POSITION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export const GeoLocationProvider = ({ children }) => {
  const watchIdRef = useRef(null);
  const [isSupported] = useState(isGeolocationSupported());
  const [permissionState, setPermissionState] = useState(
    isSupported ? "prompt" : "unsupported",
  );
  const [currentPosition, setCurrentPosition] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  const updatePosition = (position) => {
    setCurrentPosition(position);
    setLastUpdatedAt(position.timestamp || Date.now());
    setError(null);
  };

  const refreshPermissionState = async () => {
    if (!isSupported) {
      setPermissionState("unsupported");
      return "unsupported";
    }

    const nextState = await getGeolocationPermissionStatus();
    setPermissionState(nextState);
    return nextState;
  };

  useEffect(() => {
    let active = true;
    let permissionStatus = null;

    const syncPermission = async () => {
      if (!isSupported) {
        return;
      }

      const nextState = await getGeolocationPermissionStatus();
      if (active) {
        setPermissionState(nextState);
      }

      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        try {
          permissionStatus = await navigator.permissions.query({ name: "geolocation" });
          permissionStatus.onchange = () => {
            if (active) {
              setPermissionState(permissionStatus.state);
            }
          };
        } catch (permissionError) {
          // Browsers can block Permissions API access even when geolocation still works.
        }
      }
    };

    syncPermission();

    return () => {
      active = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [isSupported]);

  useEffect(() => () => {
    clearBrowserPositionWatch(watchIdRef.current);
  }, []);

  const getCurrentPosition = async (options = {}) => {
    if (!isSupported) {
      const supportError = createGeolocationError({
        code: -1,
        message: "Geolocation is not supported in this browser.",
      });
      setError(supportError);
      return null;
    }

    setIsFetching(true);
    try {
      const nextPosition = await getCurrentBrowserPosition({
        ...DEFAULT_POSITION_OPTIONS,
        ...options,
      });
      updatePosition(nextPosition);
      await refreshPermissionState();
      return nextPosition;
    } catch (positionError) {
      const nextError = createGeolocationError(positionError);
      setError(nextError);
      await refreshPermissionState();
      return null;
    } finally {
      setIsFetching(false);
    }
  };

  const stopWatching = () => {
    clearBrowserPositionWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsWatching(false);
  };

  const startWatching = async (options = {}) => {
    if (!isSupported) {
      const supportError = createGeolocationError({
        code: -1,
        message: "Geolocation is not supported in this browser.",
      });
      setError(supportError);
      return null;
    }

    stopWatching();

    try {
      watchIdRef.current = watchBrowserPosition(
        (position) => {
          updatePosition(position);
          setIsWatching(true);
        },
        (watchError) => {
          setError(watchError);
          setIsWatching(false);
        },
        {
          ...DEFAULT_POSITION_OPTIONS,
          maximumAge: 5000,
          ...options,
        },
      );
      await refreshPermissionState();
      setError(null);
      setIsWatching(true);
      return watchIdRef.current;
    } catch (watchError) {
      const nextError = createGeolocationError(watchError);
      setError(nextError);
      setIsWatching(false);
      return null;
    }
  };

  const clearPosition = () => {
    setCurrentPosition(null);
    setLastUpdatedAt(null);
  };

  const resetError = () => {
    setError(null);
  };

  const value = useMemo(
    () => ({
      isSupported,
      permissionState,
      currentPosition,
      lastUpdatedAt,
      error,
      isFetching,
      isWatching,
      getCurrentPosition,
      startWatching,
      stopWatching,
      clearPosition,
      resetError,
      refreshPermissionState,
    }),
    [currentPosition, error, isFetching, isSupported, isWatching, lastUpdatedAt, permissionState],
  );

  return (
    <GeoLocationContext.Provider value={value}>
      {children}
    </GeoLocationContext.Provider>
  );
};

export const useGeoLocationContext = () => {
  const context = useContext(GeoLocationContext);
  if (!context) {
    throw new Error("useGeoLocationContext must be used within a GeoLocationProvider");
  }
  return context;
};
