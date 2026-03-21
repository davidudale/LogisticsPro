const GOOGLE_MAPS_SCRIPT_ID = "logisticspro-google-maps";

let googleMapsPromise = null;

const getApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

export const isGoogleMapsConfigured = () => Boolean(getApiKey());

export const loadGoogleMaps = async () => {
  if (typeof window === "undefined") {
    throw new Error("Google Maps can only load in the browser.");
  }

  if (window.google?.maps?.places) {
    return window.google.maps;
  }

  if (!isGoogleMapsConfigured()) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY.");
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    const handleLoad = () => {
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps loaded without Places support."));
      }
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${getApiKey()}&libraries=places`;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")), { once: true });
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

const parseDurationSeconds = (durationValue) => {
  if (!durationValue || typeof durationValue !== "string") {
    return 0;
  }

  const matchedSeconds = durationValue.match(/([\d.]+)s$/i);
  return matchedSeconds ? Math.round(Number(matchedSeconds[1])) : 0;
};

export const computeRouteMetrics = async ({ originCoordinates, destinationCoordinates }) => {
  if (
    !isGoogleMapsConfigured()
    || typeof originCoordinates?.latitude !== "number"
    || typeof originCoordinates?.longitude !== "number"
    || typeof destinationCoordinates?.latitude !== "number"
    || typeof destinationCoordinates?.longitude !== "number"
  ) {
    return null;
  }

  const response = await fetch(ROUTES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
    },
    body: JSON.stringify({
      origin: {
        location: {
          latLng: {
            latitude: originCoordinates.latitude,
            longitude: originCoordinates.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destinationCoordinates.latitude,
            longitude: destinationCoordinates.longitude,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
      computeAlternativeRoutes: false,
      languageCode: "en-US",
      units: "METRIC",
    }),
  });

  if (!response.ok) {
    throw new Error(`Routes API request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const primaryRoute = data?.routes?.[0];

  if (!primaryRoute) {
    return null;
  }

  const distanceMeters = Number(primaryRoute.distanceMeters || 0);
  const durationSeconds = parseDurationSeconds(primaryRoute.duration);

  return {
    distanceKm: Math.round(distanceMeters / 1000),
    distanceMeters,
    durationSeconds,
    durationMinutes: Math.round(durationSeconds / 60),
    polyline: primaryRoute.polyline?.encodedPolyline || "",
    source: "google-routes",
  };
};
