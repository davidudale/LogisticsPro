import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  Crosshair,
  LoaderCircle,
  MapPin,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { app } from "../Auth/firebase";
import { useAuth } from "../Auth/AuthContext.jsx";
import { createNotificationRecord } from "../Auth/notificationUtils.js";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";
import { nigeriaLocations, nigeriaStates } from "../../data/nigeriaLocations.js";
import { useGeolocation } from "../../hooks/useGeolocation.js";
import { isGoogleMapsConfigured, loadGoogleMaps } from "../../Services/googleMaps.js";
import { getShipmentsPathByRole } from "../../utils/roles.js";

const db = getFirestore(app);
const createQuotationNumber = () => `QT-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
const createTrackingId = () => `TRK-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
const addressComponentLookup = {
  state: ["administrative_area_level_1"],
  lga: ["administrative_area_level_2", "locality", "sublocality_level_1"],
};

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatTimestamp = (value) => {
  const timestampValue = getTimestampValue(value);
  if (!timestampValue) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampValue));
};

const resolveAddressComponent = (components = [], candidateTypes = []) => {
  const matchedComponent = components.find((component) =>
    candidateTypes.some((candidateType) => component.types?.includes(candidateType)),
  );
  return matchedComponent?.long_name || "";
};

const extractAddressDetails = (geocodeResult) => {
  const components = geocodeResult?.address_components || [];
  const state = resolveAddressComponent(components, addressComponentLookup.state);
  const lga = resolveAddressComponent(components, addressComponentLookup.lga);
  const location = geocodeResult?.geometry?.location;

  return {
    state,
    lga,
    formattedAddress: geocodeResult?.formatted_address || "",
    coordinates: location
      ? {
          latitude: location.lat(),
          longitude: location.lng(),
          capturedAt: Date.now(),
        }
      : null,
  };
};

const initialAddressSuggestions = {
  origin: [],
  destination: [],
};

const initialOrderForm = {
  id: "",
  quotationNo: "",
  trackingId: "",
  customerName: "",
  originState: "",
  originLga: "",
  originAddress: "",
  destinationState: "",
  destinationLga: "",
  destinationAddress: "",
  cargo: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  itemQuantity: 1,
  originCoordinates: null,
  destinationCoordinates: null,
};

const CustomersDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [submissionMode, setSubmissionMode] = useState("");
  const [activeGeoTarget, setActiveGeoTarget] = useState("");
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState(initialAddressSuggestions);
  const [routePreview, setRoutePreview] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerQuotations, setCustomerQuotations] = useState([]);
  const [trackingLookup, setTrackingLookup] = useState("");
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const quotationsPath = getShipmentsPathByRole(user?.role, "quotations");
  const requestsPath = getShipmentsPathByRole(user?.role, "requests");
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const suggestionHideTimeoutRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const {
    currentPosition,
    error: geolocationError,
    getCurrentPosition,
    isFetching: isFetchingLocation,
    isSupported: isGeolocationSupported,
    isWatching: isWatchingLocation,
    permissionState,
    startWatching,
    stopWatching,
    resetError: resetGeolocationError,
  } = useGeolocation();
  useEffect(() => {
    if (!isGoogleMapsConfigured()) {
      setMapsError("Set VITE_GOOGLE_MAPS_API_KEY to enable Google address suggestions.");
      return;
    }

    let isActive = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isActive) return;
        autocompleteServiceRef.current = new maps.places.AutocompleteService();
        geocoderRef.current = new maps.Geocoder();
        directionsServiceRef.current = new maps.DirectionsService();
        setMapsReady(true);
        setMapsError("");
      })
      .catch((error) => {
        if (!isActive) return;
        setMapsError(error?.message || "Failed to load Google Maps services.");
      });

    return () => {
      isActive = false;
      if (suggestionHideTimeoutRef.current) {
        clearTimeout(suggestionHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapsReady || !isCreateOrderOpen || !mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: 9.082, lng: 8.6753 },
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#172554" }] },
      ],
    });

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#f97316",
        strokeOpacity: 0.95,
        strokeWeight: 5,
      },
    });
  }, [isCreateOrderOpen, mapsReady]);

  useEffect(() => {
    if (!mapsReady || !isCreateOrderOpen || !mapInstanceRef.current) {
      return;
    }

    const map = mapInstanceRef.current;
    const origin = orderForm.originCoordinates;
    const destination = orderForm.destinationCoordinates;

    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null);
      originMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    setRoutePreview(null);

    const bounds = new window.google.maps.LatLngBounds();

    if (origin?.latitude && origin?.longitude) {
      const originPosition = { lat: origin.latitude, lng: origin.longitude };
      originMarkerRef.current = new window.google.maps.Marker({
        map,
        position: originPosition,
        title: "Pickup location",
        label: "O",
      });
      bounds.extend(originPosition);
    }

    if (destination?.latitude && destination?.longitude) {
      const destinationPosition = { lat: destination.latitude, lng: destination.longitude };
      destinationMarkerRef.current = new window.google.maps.Marker({
        map,
        position: destinationPosition,
        title: "Destination location",
        label: "D",
      });
      bounds.extend(destinationPosition);
    }

    if (
      origin?.latitude
      && origin?.longitude
      && destination?.latitude
      && destination?.longitude
      && directionsServiceRef.current
      && directionsRendererRef.current
    ) {
      directionsServiceRef.current.route(
        {
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status !== "OK" || !result?.routes?.length) {
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, 80);
            }
            return;
          }

          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0]?.legs?.[0];
          setRoutePreview({
            distanceText: leg?.distance?.text || "Not available",
            durationText: leg?.duration?.text || "Not available",
            startAddress: leg?.start_address || orderForm.originAddress || "Origin",
            endAddress: leg?.end_address || orderForm.destinationAddress || "Destination",
          });
        },
      );
      return;
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 80);
    } else {
      map.setCenter({ lat: 9.082, lng: 8.6753 });
      map.setZoom(6);
    }
  }, [
    isCreateOrderOpen,
    mapsReady,
    orderForm.destinationAddress,
    orderForm.destinationCoordinates,
    orderForm.originAddress,
    orderForm.originCoordinates,
  ]);

  const openCreateQuotationModal = () => {
    setOrderForm((prev) => ({
      ...initialOrderForm,
      quotationNo: createQuotationNumber(),
      trackingId: createTrackingId(),
      customerName: prev.customerName || user?.displayName || "",
    }));
    setAddressSuggestions(initialAddressSuggestions);
    setRoutePreview(null);
    setIsCreateOrderOpen(true);
  };

  useEffect(() => {
    if (location.state?.openQuotationModal) {
      if (location.state?.editQuotation) {
        const draftQuotation = location.state.editQuotation;
        setOrderForm({
          id: draftQuotation.id || "",
          quotationNo: draftQuotation.quotationNo || createQuotationNumber(),
          trackingId: draftQuotation.trackingId || createTrackingId(),
          customerName: draftQuotation.customerName || user?.displayName || "",
          originState: draftQuotation.origin?.state || "",
          originLga: draftQuotation.origin?.lga || "",
          originAddress: draftQuotation.origin?.address || "",
          destinationState: draftQuotation.destination?.state || "",
          destinationLga: draftQuotation.destination?.lga || "",
          destinationAddress: draftQuotation.destination?.address || "",
          cargo: draftQuotation.cargo || "",
          weight: draftQuotation.weight || "",
          length: draftQuotation.dimensions?.lengthCm || "",
          width: draftQuotation.dimensions?.widthCm || "",
          height: draftQuotation.dimensions?.heightCm || "",
          itemQuantity: draftQuotation.itemQuantity || 1,
          originCoordinates: draftQuotation.origin?.coordinates || null,
          destinationCoordinates: draftQuotation.destination?.coordinates || null,
        });
        setAddressSuggestions(initialAddressSuggestions);
        setRoutePreview(null);
        setIsCreateOrderOpen(true);
      } else {
        openCreateQuotationModal();
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate, user?.displayName]);

  useEffect(() => {
    if (isCreateOrderOpen) {
      return undefined;
    }

    stopWatching();
    setActiveGeoTarget("");
    return undefined;
  }, [isCreateOrderOpen, stopWatching]);

  const handleOrderFieldChange = (name, value) => {
    setOrderForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "originState" ? { originLga: "" } : {}),
      ...(name === "destinationState" ? { destinationLga: "" } : {}),
    }));
  };

  const fetchAddressSuggestions = (target, value) => {
    if (!mapsReady || !autocompleteServiceRef.current || value.trim().length < 3) {
      setAddressSuggestions((prev) => ({ ...prev, [target]: [] }));
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: value.trim(),
        componentRestrictions: { country: "ng" },
        types: ["geocode"],
      },
      (predictions, status) => {
        if (
          status !== window.google?.maps?.places?.PlacesServiceStatus?.OK
          || !Array.isArray(predictions)
        ) {
          setAddressSuggestions((prev) => ({ ...prev, [target]: [] }));
          return;
        }

        setAddressSuggestions((prev) => ({
          ...prev,
          [target]: predictions.slice(0, 5).map((prediction) => ({
            description: prediction.description,
            placeId: prediction.place_id,
          })),
        }));
      },
    );
  };

  const handleAddressInputChange = (target, value) => {
    const fieldName = target === "origin" ? "originAddress" : "destinationAddress";
    const coordinateField = target === "origin" ? "originCoordinates" : "destinationCoordinates";
    handleOrderFieldChange(fieldName, value);
    setOrderForm((prev) => ({
      ...prev,
      [coordinateField]: null,
    }));
    fetchAddressSuggestions(target, value);
  };

  const applyResolvedAddress = (target, resolvedAddress) => {
    setOrderForm((prev) => ({
      ...prev,
      [target === "origin" ? "originState" : "destinationState"]: resolvedAddress.state || prev[target === "origin" ? "originState" : "destinationState"],
      [target === "origin" ? "originLga" : "destinationLga"]: resolvedAddress.lga || prev[target === "origin" ? "originLga" : "destinationLga"],
      [target === "origin" ? "originAddress" : "destinationAddress"]: resolvedAddress.formattedAddress || prev[target === "origin" ? "originAddress" : "destinationAddress"],
      [target === "origin" ? "originCoordinates" : "destinationCoordinates"]: resolvedAddress.coordinates,
    }));
  };

  const selectAddressSuggestion = (target, suggestion) => {
    if (!geocoderRef.current) {
      return;
    }

    geocoderRef.current.geocode({ placeId: suggestion.placeId }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        toast.error("Unable to resolve the selected address.");
        return;
      }

      applyResolvedAddress(target, extractAddressDetails(results[0]));
      setAddressSuggestions((prev) => ({ ...prev, [target]: [] }));
    });
  };

  const resolveTypedAddress = async (target) => {
    const addressValue = target === "origin" ? orderForm.originAddress : orderForm.destinationAddress;
    const stateValue = target === "origin" ? orderForm.originState : orderForm.destinationState;
    const lgaValue = target === "origin" ? orderForm.originLga : orderForm.destinationLga;
    const coordinateValue = target === "origin" ? orderForm.originCoordinates : orderForm.destinationCoordinates;

    if (!mapsReady || !geocoderRef.current || !addressValue.trim() || coordinateValue) {
      return;
    }

    const addressQuery = [addressValue.trim(), lgaValue.trim(), stateValue.trim(), "Nigeria"]
      .filter(Boolean)
      .join(", ");

    await new Promise((resolve) => {
      geocoderRef.current.geocode({ address: addressQuery }, (results, status) => {
        if (status === "OK" && results?.length) {
          applyResolvedAddress(target, extractAddressDetails(results[0]));
        }
        resolve();
      });
    });
  };

  const handleAddressBlur = (target) => {
    suggestionHideTimeoutRef.current = setTimeout(() => {
      setAddressSuggestions((prev) => ({ ...prev, [target]: [] }));
    }, 120);
  };

  const cancelAddressBlur = () => {
    if (suggestionHideTimeoutRef.current) {
      clearTimeout(suggestionHideTimeoutRef.current);
    }
  };

  const updateItemQuantity = (delta) => {
    setOrderForm((prev) => {
      const currentQuantity = Number.isFinite(Number(prev.itemQuantity))
        ? Number(prev.itemQuantity)
        : 1;

      return {
        ...prev,
        itemQuantity: Math.max(1, currentQuantity + delta),
      };
    });
  };

  const handleItemQuantityChange = (value) => {
    const numericValue = Number(value);
    setOrderForm((prev) => ({
      ...prev,
      itemQuantity: value === "" ? "" : Math.max(1, Number.isFinite(numericValue) ? numericValue : 1),
    }));
  };

  const formatCoordinates = (coordinates) => {
    if (!coordinates?.latitude || !coordinates?.longitude) {
      return "Coordinates not captured yet.";
    }

    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  };

  const formatCapturedAt = (coordinates) => {
    if (!coordinates?.capturedAt) {
      return "";
    }

    return new Date(coordinates.capturedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const resolveCurrentLocationDetails = async (target, position) => {
    const coordinates = {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      capturedAt: position.timestamp || Date.now(),
    };

    let resolvedAddress = {
      formattedAddress: `Current location (${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)})`,
      state: "",
      lga: "",
      coordinates,
    };

    if (mapsReady && geocoderRef.current) {
      await new Promise((resolve) => {
        geocoderRef.current.geocode(
          {
            location: {
              lat: position.latitude,
              lng: position.longitude,
            },
          },
          (results, status) => {
            if (status === "OK" && results?.length) {
              resolvedAddress = {
                ...extractAddressDetails(results[0]),
                coordinates,
              };
            }
            resolve();
          },
        );
      });
    }

    applyResolvedAddress(target, resolvedAddress);
  };

  useEffect(() => {
    if (!isCreateOrderOpen || !activeGeoTarget || !currentPosition) {
      return;
    }

    resolveCurrentLocationDetails(activeGeoTarget, currentPosition);
  }, [activeGeoTarget, currentPosition, isCreateOrderOpen, mapsReady]);

  useEffect(() => {
    const loadCustomerRecords = async () => {
      if (!user?.uid && !user?.email) {
        setCustomerOrders([]);
        setCustomerQuotations([]);
        setRecordsLoading(false);
        return;
      }

      setRecordsLoading(true);
      try {
        const ordersRef = collection(db, "customer_order");
        const quotationsRef = collection(db, "Quotations");
        const [
          orderUidSnap,
          orderEmailSnap,
          quotationUidSnap,
          quotationEmailSnap,
        ] = await Promise.all([
          user?.uid ? getDocs(query(ordersRef, where("customerUid", "==", user.uid))) : Promise.resolve(null),
          user?.email ? getDocs(query(ordersRef, where("customerEmail", "==", user.email))) : Promise.resolve(null),
          user?.uid ? getDocs(query(quotationsRef, where("customerUid", "==", user.uid))) : Promise.resolve(null),
          user?.email ? getDocs(query(quotationsRef, where("customerEmail", "==", user.email))) : Promise.resolve(null),
        ]);

        const orderRecords = new Map();
        [orderUidSnap, orderEmailSnap].forEach((snapshot) => {
          snapshot?.docs.forEach((item) => {
            orderRecords.set(item.id, { id: item.id, ...item.data() });
          });
        });

        const quotationRecords = new Map();
        [quotationUidSnap, quotationEmailSnap].forEach((snapshot) => {
          snapshot?.docs.forEach((item) => {
            quotationRecords.set(item.id, { id: item.id, ...item.data() });
          });
        });

        setCustomerOrders(Array.from(orderRecords.values()));
        setCustomerQuotations(Array.from(quotationRecords.values()));
      } catch (error) {
        toast.error(error?.message || "Failed to load your dashboard records.");
      } finally {
        setRecordsLoading(false);
      }
    };

    loadCustomerRecords();
  }, [user?.uid, user?.email]);

  const applyCurrentLocation = async (target) => {
    resetGeolocationError();

    const position = await getCurrentPosition();
    if (!position) {
      const message = geolocationError?.message || "Unable to capture your current location.";
      toast.error(message);
      setActiveGeoTarget("");
      return;
    }

    setActiveGeoTarget(target);
    await resolveCurrentLocationDetails(target, position);
    await startWatching({ enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });

    toast.success(
      `${target === "origin" ? "Pickup" : "Destination"} live location started.`,
    );
  };

const buildQuotationPayload = (resolvedQuotationNo, status) => ({
  quotationNo: resolvedQuotationNo,
  trackingId: orderForm.trackingId.trim(),
  customerName: orderForm.customerName.trim(),
    origin: {
      state: orderForm.originState.trim(),
      lga: orderForm.originLga.trim(),
      address: orderForm.originAddress.trim(),
      country: "Nigeria",
      coordinates: orderForm.originCoordinates,
    },
    destination: {
      state: orderForm.destinationState.trim(),
      lga: orderForm.destinationLga.trim(),
      address: orderForm.destinationAddress.trim(),
      country: "Nigeria",
      coordinates: orderForm.destinationCoordinates,
    },
    cargo: orderForm.cargo.trim(),
    weight: orderForm.weight.trim(),
    dimensions: {
      lengthCm: orderForm.length.trim(),
      widthCm: orderForm.width.trim(),
      heightCm: orderForm.height.trim(),
    },
    itemQuantity: orderForm.itemQuantity,
    deliveryAddress: [
      orderForm.destinationAddress.trim(),
      orderForm.destinationLga.trim(),
      orderForm.destinationState.trim(),
      "Nigeria",
    ].filter(Boolean).join(", "),
    status,
    customerUid: user?.uid || "",
    customerEmail: user?.email || "",
    updatedAt: serverTimestamp(),
  });

  const persistQuotation = async ({ mode, requireCompleteDetails }) => {
    if (
      requireCompleteDetails
      && (
        !orderForm.quotationNo
        || !orderForm.customerName
        || !orderForm.originState
        || !orderForm.originLga
        || !orderForm.originAddress
        || !orderForm.destinationState
        || !orderForm.destinationLga
        || !orderForm.destinationAddress
        || !orderForm.cargo
        || !orderForm.weight
        || !orderForm.length
        || !orderForm.width
        || !orderForm.height
      )
    ) {
      toast.info("Complete all required order details before submitting.");
      return;
    }

    if (!requireCompleteDetails && !orderForm.customerName.trim() && !orderForm.cargo.trim()) {
      toast.info("Add at least a customer name or cargo before saving a draft.");
      return;
    }

    setSubmissionMode(mode);
    try {
      await Promise.all([
        resolveTypedAddress("origin"),
        resolveTypedAddress("destination"),
      ]);
      const quotationNo = createQuotationNumber();
      const resolvedQuotationNo = orderForm.quotationNo.trim() || quotationNo;
      const payload = buildQuotationPayload(resolvedQuotationNo, mode === "draft" ? "SAVE" : "Quotation Pending");

      if (orderForm.id) {
        await updateDoc(doc(db, "Quotations", orderForm.id), payload);
      } else {
        await addDoc(collection(db, "Quotations"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      if (mode !== "draft") {
        await createNotificationRecord({
          title: "Quotation Request Submitted",
          message: `${orderForm.customerName.trim() || "A customer"} submitted quotation ${resolvedQuotationNo} for admin review.`,
          targetRole: "admin",
          type: "quotation_submitted",
          quotationNo: resolvedQuotationNo,
          customerUid: user?.uid || "",
          customerEmail: user?.email || "",
        });
      }

      toast.success(
        mode === "draft"
          ? `${orderForm.id ? "Quotation draft updated" : "Quotation draft saved"}: ${resolvedQuotationNo}`
          : `${orderForm.id ? "Quotation updated and submitted" : "Quotation request submitted"}: ${resolvedQuotationNo}`,
      );
      setOrderForm(initialOrderForm);
      setAddressSuggestions(initialAddressSuggestions);
      setRoutePreview(null);
      setIsCreateOrderOpen(false);
    } catch (error) {
      toast.error(
        error?.message || (mode === "draft"
          ? "Failed to save quotation draft."
          : "Failed to submit quotation request."),
      );
    } finally {
      setSubmissionMode("");
    }
  };

  const originLgas = orderForm.originState ? nigeriaLocations[orderForm.originState] || [] : [];
  const destinationLgas = orderForm.destinationState ? nigeriaLocations[orderForm.destinationState] || [] : [];
  const deliveredStatuses = new Set(["delivered", "completed", "closed"]);
  const transitStatuses = new Set(["shipment booked", "shipment booking - in progress", "in transit", "assigned"]);

  const dashboardMetrics = useMemo(() => {
    const openOrders = customerOrders.filter((order) => !deliveredStatuses.has((order.status || "").toString().trim().toLowerCase())).length;
    const inTransit = customerOrders.filter(( ) => transitStatuses.has(("Shipment in transit").toString().trim().toLowerCase())).length;
    const delivered = customerOrders.filter((order) => deliveredStatuses.has((order.status || "").toString().trim().toLowerCase())).length;
    const activeQuotations = customerQuotations.filter((quotation) => {
      const normalizedStatus = (quotation.status || "").toString().trim().toLowerCase();
      return normalizedStatus !== "save" && normalizedStatus !== "shipment awaiting approval";
    }).length;

    const recentActivity = [
      ...customerQuotations.map((quotation) => ({
        id: `quotation:${quotation.id}`,
        title: quotation.trackingId || quotation.quotationNo || quotation.id,
        subtitle: quotation.cargo || quotation.customerName || "Quotation request",
        status: quotation.status || "Pending",
        updatedAt: quotation.updatedAt || quotation.createdAt,
        to: quotationsPath,
      })),
      ...customerOrders.map((order) => ({
        id: `order:${order.id}`,
        title: order.trackingId || order.orderNo || order.id,
        subtitle: order.deliveryAddress || order.cargo || "Shipment order",
        status: order.status || "Created",
        updatedAt: order.updatedAt || order.createdAt,
        to: requestsPath,
      })),
    ]
      .sort((left, right) => getTimestampValue(right.updatedAt) - getTimestampValue(left.updatedAt))
      .slice(0, 6);

    return {
      openOrders,
      inTransit,
      delivered,
      activeQuotations,
      recentActivity,
    };
  }, [customerOrders, customerQuotations, quotationsPath, requestsPath]);

  const stats = [
    { label: "Open Orders", value: dashboardMetrics.openOrders, icon: ClipboardList, detail: "Orders still active in the workflow" },
    { label: "In Transit", value: dashboardMetrics.inTransit, icon: MapPin, detail: "Shipments currently moving or assigned" },
    { label: "Delivered", value: dashboardMetrics.delivered, icon: Package, detail: "Orders marked delivered or closed" },
    { label: "Active Quotations", value: dashboardMetrics.activeQuotations, icon: Activity, detail: "Requests still under review or negotiation" },
  ];

  const quickActions = [
    {
      label: "Create quotation",
      description: "Start a new shipment pricing request with route and cargo details.",
      action: openCreateQuotationModal,
    },
    {
      label: "Open quotations",
      description: "Review pending quotes, pricing breakdowns, and negotiations.",
      action: () => navigate(quotationsPath),
    },
    {
      label: "Check shipment requests",
      description: "Track accepted quotations that became active orders.",
      action: () => navigate(requestsPath),
    },
  ];

  const trackingLookupResult = useMemo(() => {
    const value = trackingLookup.trim().toLowerCase();
    if (!value) return null;

    const matchingOrder = customerOrders.find((order) =>
      [
        order.trackingId,
        order.orderNo,
        order.quotationNo,
      ]
        .filter(Boolean)
        .some((item) => item.toString().trim().toLowerCase() === value),
    );

    if (matchingOrder) {
      return {
        type: "Order",
        title: matchingOrder.trackingId || matchingOrder.orderNo || matchingOrder.id,
        subtitle: matchingOrder.deliveryAddress || matchingOrder.cargo || "Shipment order",
        status: matchingOrder.status || "Created",
        to: requestsPath,
      };
    }

    const matchingQuotation = customerQuotations.find((quotation) =>
      [
        quotation.trackingId,
        quotation.quotationNo,
      ]
        .filter(Boolean)
        .some((item) => item.toString().trim().toLowerCase() === value),
    );

    if (matchingQuotation) {
      return {
        type: "Quotation",
        title: matchingQuotation.trackingId || matchingQuotation.quotationNo || matchingQuotation.id,
        subtitle: matchingQuotation.cargo || matchingQuotation.customerName || "Quotation request",
        status: matchingQuotation.status || "Pending",
        to: quotationsPath,
      };
    }

    return { type: "Missing" };
  }, [customerOrders, customerQuotations, quotationsPath, requestsPath, trackingLookup]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <NavBar
        title="Customer Dashboard"
        onToggleSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 p-4 lg:p-8 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50">
              <div className="relative px-6 py-7 lg:px-8">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_62%)]" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer Workspace</p>
                    <h1 className="mt-3 text-3xl font-bold text-white lg:text-4xl">Shipment Visibility</h1>
                    
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(quotationsPath)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
                    >
                      <ReceiptText size={16} />
                      My Quotations
                    </button>
                    <button
                      type="button"
                      onClick={openCreateQuotationModal}
                      className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                    >
                      <Plus size={16} />
                      Get Quotation
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all"
                  >
                    <div className="p-2 w-fit bg-slate-950 rounded-lg border border-slate-800 group-hover:border-orange-500/50 transition-colors">
                      <Icon className="text-orange-500" size={18} />
                    </div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-tight mt-4">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-white mt-1">{recordsLoading ? "--" : stat.value}</p>
                    <p className="mt-2 text-sm text-slate-400">{stat.detail}</p>
                  </div>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 ">
                <div className="flex items-center justify-between gap-3 ">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recent Activity</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Latest quotation and shipment updates</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(requestsPath)}
                    disabled={recordsLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-orange-500/40 hover:text-white disabled:opacity-60"
                  >
                    <RefreshCw size={14} className={recordsLoading ? "animate-spin" : ""} />
                    View all
                  </button>
                </div>
                <div className="mt-5 space-y-3 ">
                  {recordsLoading ? (
                    <p className="text-sm text-slate-400 ">Loading your latest activity...</p>
                  ) : dashboardMetrics.recentActivity.length ? (
                    dashboardMetrics.recentActivity.map((entry, index) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => navigate(entry.to)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          index === 0
                            ? "border-slate-800 bg-slate-950/60 hover:bg-orange-500/15"
                            : "border-slate-800 bg-slate-950/60 hover:border-orange-500/30 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row  sm:items-start sm:justify-between rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{entry.title}</p>
                            <p className="mt-1 text-sm text-slate-400">{entry.subtitle}</p>
                          </div>
                          <p className="text-xs text-slate-500">{formatTimestamp(entry.updatedAt)}</p>
                        </div>
                        <div
                          className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            index === 0
                              ? "border-orange-500/40 bg-gradient-to-r from-orange-500/20 via-orange-500/8 to-transparent text-orange-100 shadow-[0_18px_40px_-28px_rgba(249,115,22,0.95)"
                              : "border-slate-700 bg-slate-900 text-slate-200"
                          }`}
                        >
                          {entry.status}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-6 text-center">
                      <p className="text-base font-semibold text-white">No shipment activity yet.</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Start a quotation request to begin tracking your shipment activity here.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quick Actions</p>
                  <div className="mt-4 space-y-3">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.action}
                        className="flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-orange-500/40 hover:bg-slate-900"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{action.label}</p>
                          <p className="mt-1 text-sm text-slate-400">{action.description}</p>
                        </div>
                        <ArrowRight size={16} className="mt-1 shrink-0 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Track ID Lookup</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-col gap-3">
                      <input
                        value={trackingLookup}
                        onChange={(event) => setTrackingLookup(event.target.value)}
                        className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                        placeholder="Enter track ID, order no, or quotation no"
                      />
                      {trackingLookup.trim() ? (
                        trackingLookupResult?.type === "Missing" ? (
                          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
                            No shipment or quotation matched that track ID yet.
                          </div>
                        ) : trackingLookupResult ? (
                          <button
                            type="button"
                            onClick={() => navigate(trackingLookupResult.to)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-orange-500/40 hover:bg-slate-900"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{trackingLookupResult.title}</p>
                                <p className="mt-1 text-sm text-slate-400">{trackingLookupResult.subtitle}</p>
                              </div>
                              <span className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                                {trackingLookupResult.type}
                              </span>
                            </div>
                            <div className="mt-3 inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200">
                              {trackingLookupResult.status}
                            </div>
                          </button>
                        ) : null
                      ) : (
                        <p className="text-sm text-slate-400">
                          Track IDs are created automatically when you open a new quotation request.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Journey Snapshot</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-sm font-semibold text-white">Request to quote</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Capture origin, destination, cargo, and dimensions to help the team price faster.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-sm font-semibold text-white">Review and respond</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Accept, negotiate, or revisit saved drafts directly from your quotations workspace.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-sm font-semibold text-white">Track active delivery</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Once a quotation is accepted, your shipment order appears under requests for ongoing visibility.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {isCreateOrderOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 ">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Get Quotation</h3>
              <button
                type="button"
                onClick={() => setIsCreateOrderOpen(false)}
                className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                persistQuotation({ mode: "submit", requireCompleteDetails: true });
              }}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <input
                value={orderForm.quotationNo}
                readOnly
                className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-300 outline-none"
                placeholder="Quotation Number"
              />
              <input
                value={orderForm.trackingId}
                readOnly
                className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-300 outline-none"
                placeholder="Tracking ID"
              />
              <input
                value={orderForm.customerName}
                onChange={(event) => handleOrderFieldChange("customerName", event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                placeholder="Customer Name"
                required
              />
              <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Origin</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Capture your current pickup coordinates to help admin verify the route faster.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyCurrentLocation("origin")}
                    disabled={!isGeolocationSupported || isFetchingLocation}
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-orange-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingLocation && activeGeoTarget === "origin" ? (
                      <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Crosshair size={14} />
                      )}
                    {activeGeoTarget === "origin" && isWatchingLocation ? "Live location active" : "Use current location"}
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={orderForm.originState}
                    onChange={(event) => handleOrderFieldChange("originState", event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Select origin state</option>
                    {nigeriaStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <select
                    value={orderForm.originLga}
                    onChange={(event) => handleOrderFieldChange("originLga", event.target.value)}
                    disabled={!orderForm.originState}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  >
                    <option value="">{orderForm.originState ? "Select origin LGA" : "Select state first"}</option>
                    {originLgas.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                  <div className="sm:col-span-2 relative">
                    <input
                      value={orderForm.originAddress}
                      onChange={(event) => handleAddressInputChange("origin", event.target.value)}
                      onBlur={() => handleAddressBlur("origin")}
                      onFocus={() => fetchAddressSuggestions("origin", orderForm.originAddress)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      placeholder="Origin address"
                      required
                    />
                    {addressSuggestions.origin.length ? (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
                        {addressSuggestions.origin.map((suggestion) => (
                          <button
                            key={suggestion.placeId}
                            type="button"
                            onMouseDown={cancelAddressBlur}
                            onClick={() => selectAddressSuggestion("origin", suggestion)}
                            className="block w-full border-b border-slate-800 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 last:border-b-0"
                          >
                            {suggestion.description}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
                  <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Captured pickup coordinates</p>
                  <p className="mt-1 text-slate-300">{formatCoordinates(orderForm.originCoordinates)}</p>
                  {activeGeoTarget === "origin" && isWatchingLocation && formatCapturedAt(orderForm.originCoordinates) ? (
                    <p className="mt-1 text-emerald-300">
                      Live update: {formatCapturedAt(orderForm.originCoordinates)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Destination</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Use this if you are requesting delivery to your present location.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyCurrentLocation("destination")}
                    disabled={!isGeolocationSupported || isFetchingLocation}
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-orange-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingLocation && activeGeoTarget === "destination" ? (
                      <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Crosshair size={14} />
                      )}
                    {activeGeoTarget === "destination" && isWatchingLocation ? "Live location active" : "Use current location"}
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={orderForm.destinationState}
                    onChange={(event) => handleOrderFieldChange("destinationState", event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Select destination state</option>
                    {nigeriaStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <select
                    value={orderForm.destinationLga}
                    onChange={(event) => handleOrderFieldChange("destinationLga", event.target.value)}
                    disabled={!orderForm.destinationState}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  >
                    <option value="">{orderForm.destinationState ? "Select destination LGA" : "Select state first"}</option>
                    {destinationLgas.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                  <div className="sm:col-span-2 relative">
                    <input
                      value={orderForm.destinationAddress}
                      onChange={(event) => handleAddressInputChange("destination", event.target.value)}
                      onBlur={() => handleAddressBlur("destination")}
                      onFocus={() => fetchAddressSuggestions("destination", orderForm.destinationAddress)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                      placeholder="Destination address"
                      required
                    />
                    {addressSuggestions.destination.length ? (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
                        {addressSuggestions.destination.map((suggestion) => (
                          <button
                            key={suggestion.placeId}
                            type="button"
                            onMouseDown={cancelAddressBlur}
                            onClick={() => selectAddressSuggestion("destination", suggestion)}
                            className="block w-full border-b border-slate-800 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 last:border-b-0"
                          >
                            {suggestion.description}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
                  <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Captured destination coordinates</p>
                  <p className="mt-1 text-slate-300">{formatCoordinates(orderForm.destinationCoordinates)}</p>
                  {activeGeoTarget === "destination" && isWatchingLocation && formatCapturedAt(orderForm.destinationCoordinates) ? (
                    <p className="mt-1 text-emerald-300">
                      Live update: {formatCapturedAt(orderForm.destinationCoordinates)}
                    </p>
                  ) : null}
                </div>
              </div>
             {/* <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Route Map</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Preview your pickup and destination on Google Maps before submitting the quotation request.
                    </p>
                  </div>
                  {routePreview ? (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                      <p>Distance: {routePreview.distanceText}</p>
                      <p className="mt-1">Drive time: {routePreview.durationText}</p>
                    </div>
                  ) : null}
                </div>
                <div
                  ref={mapContainerRef}
                  className="mt-4 h-72 w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
                />
                {routePreview ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                      <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Route Start</p>
                      <p className="mt-1">{routePreview.startAddress}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                      <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Route End</p>
                      <p className="mt-1">{routePreview.endAddress}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Select both pickup and destination addresses to render the full route preview on the map.
                  </p>
                )}
              </div>*/}
              <input
                value={orderForm.cargo}
                onChange={(event) => handleOrderFieldChange("cargo", event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                placeholder="Cargo"
                required
              />
              <input
                value={orderForm.weight}
                onChange={(event) => handleOrderFieldChange("weight", event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                placeholder="Weight"
                required
              />
              <div className="sm:col-span-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(120px,160px)] lg:items-end">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Item Dimensions</p>
                  <input
                    value={orderForm.length}
                    onChange={(event) => handleOrderFieldChange("length", event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    placeholder="Length (cm)"
                    required
                  />
                </div>
                <span className="hidden pb-2 text-lg font-bold text-white lg:block">X</span>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-transparent">Item Dimensions</p>
                  <input
                    value={orderForm.width}
                    onChange={(event) => handleOrderFieldChange("width", event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    placeholder="Width (cm)"
                    required
                  />
                </div>
                <span className="hidden pb-2 text-lg font-bold text-white lg:block">X</span>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-transparent">Item Dimensions</p>
                  <input
                    value={orderForm.height}
                    onChange={(event) => handleOrderFieldChange("height", event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    placeholder="Height (cm)"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Item Quantity</p>
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(-1)}
                      className="text-lg font-bold text-white"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={orderForm.itemQuantity}
                      onChange={(event) => handleItemQuantityChange(event.target.value)}
                      className="mx-3 w-20 rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-center text-sm font-semibold text-white outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(1)}
                      className="text-lg font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => persistQuotation({ mode: "draft", requireCompleteDetails: false })}
                disabled={submissionMode !== ""}
                className="rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-orange-500/40 hover:text-white disabled:opacity-70"
              >
                {submissionMode === "draft" ? "Saving Draft..." : "Save Draft"}
              </button>
              <button
                type="submit"
                disabled={submissionMode !== ""}
                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70"
              >
                {submissionMode === "submit" ? "Submitting..." : "Get Quotation"}
              </button>
              {!isGeolocationSupported ? (
                <p className="sm:col-span-2 text-xs text-amber-300">
                  Geolocation is not supported in this browser, so coordinates cannot be captured automatically.
                </p>
              ) : permissionState === "denied" ? (
                <p className="sm:col-span-2 text-xs text-amber-300">
                  Location access is blocked in your browser. Enable it if you want pickup or destination coordinates attached to this quotation.
                </p>
              ) : null}
              {mapsError ? (
                <p className="sm:col-span-2 text-xs text-slate-400">
                  {mapsError}
                </p>
              ) : mapsReady ? (
                <p className="sm:col-span-2 text-xs text-emerald-300">
                  Google address suggestions are active for origin and destination.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CustomersDashboard;
