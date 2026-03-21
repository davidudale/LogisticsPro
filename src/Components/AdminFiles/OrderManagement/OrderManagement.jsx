import React, { useEffect, useMemo, useState } from "react";
import { Eye, MessageSquare, Pencil, Plus, Printer, Search, Trash2, Truck, Users } from "lucide-react";
import { toast } from "react-toastify";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";
import { app } from "../../Auth/firebase";
import { createNotificationRecord } from "../../Auth/notificationUtils.js";
import { computeRouteMetrics, isGoogleMapsConfigured } from "../../../services/googleMaps.js";
import InvoicePreviewModal from "../../Shared/InvoicePreviewModal.jsx";

const db = getFirestore(app);

const COLLECTIONS = {
  customers: "customer_order",
  orders: "order_shipments",
  support: "order_issues",
  notifications: "notifications",
  fleetVehicles: "fleet_vehicles",
  fleetDrivers: "fleet_drivers",
  fleetRoutes: "fleet_routes",
};

const formatLocation = (location) => {
  if (!location || typeof location !== "object") return "Not available";
  return [location.address, location.lga, location.state, location.country].filter(Boolean).join(", ");
};

const formatEtaFromMinutes = (durationMinutes) => {
  if (!durationMinutes || durationMinutes <= 0) {
    return "";
  }

  const etaDate = new Date(Date.now() + durationMinutes * 60 * 1000);
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(etaDate);
};

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatTimestamp = (record) => {
  const timestampValue = getTimestampValue(record.updatedAt || record.createdAt);
  if (!timestampValue) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampValue));
};

const formatDateValue = (value) => {
  if (!value) return "Not set";
  const timestampValue = getTimestampValue(value);
  if (!timestampValue) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestampValue));
};

const normalizeIdentifier = (value) => value?.toString().trim().toUpperCase() || "";

const mapCustomerRecord = (item) => {
  const data = item.data();
    return {
      id: item.id,
      orderNo: data.orderNo || "",
      quotationNo: data.quotationNo || "",
      customerName: data.customerName || data.customer || "",
      customerUid: data.customerUid || "",
      customerEmail: data.customerEmail || "",
      truckId: data.truckId || "",
      cargo: data.cargo || "",
      weight: data.weight || "",
      status: data.status || "Shipment Booking - In Progress",
      origin: data.origin || {},
      destination: data.destination || {},
      deliveryAddress: data.deliveryAddress || formatLocation(data.destination),
      eta: data.eta || "",
      routeDistanceKm: data.routeDistanceKm || 0,
      routeDurationMinutes: data.routeDurationMinutes || 0,
      routePolyline: data.routePolyline || "",
      routeSource: data.routeSource || "",
      itemQuantity: data.itemQuantity || 1,
      dimensions: data.dimensions || {},
      quoteTotal: data.quoteTotal || 0,
      quotationBreakdown: data.quotationBreakdown || {},
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  };

const mapOrderRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    orderNo: data.orderNo || data.id || "",
    truckId: data.truckId || "",
    location: data.location || "",
    eta: data.eta || "TBD",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

const mapDriverRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    fullName: data.fullName || "",
    assignedTruckId: normalizeIdentifier(data.assignedTruckId),
    assignmentStatus: data.assignmentStatus || "Available",
    territory: data.territory || "",
    certificationStatus: data.certificationStatus || "Compliant",
  };
};

const mapRouteRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    routeName: data.routeName || "",
    route: data.route || "",
    assignedDriver: data.assignedDriver || "",
    assignedVehicle: normalizeIdentifier(data.assignedVehicle),
    estimatedTime: data.estimatedTime || "",
    distance: data.distance || "",
    etaUpdate: data.etaUpdate || "",
    gpsStatus: data.gpsStatus || "",
    path: Array.isArray(data.path) ? data.path : [],
  };
};

const mapSupportRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    deliveryNo: data.deliveryNo || data.ticketNo || data.id || "",
    orderNo: data.orderNo || "",
    confirmation: data.confirmation || "Pending",
    feedback: data.feedback || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

const emptyCustomerForm = {
  orderNo: "",
  customerName: "",
  truckId: "",
  deliveryAddress: "",
};

const emptyOrderForm = {
  orderNo: "",
  truckId: "",
  location: "",
  eta: "",
};

const emptySupportForm = {
  deliveryNo: "",
  orderNo: "",
  confirmation: "",
  feedback: "",
};

const OrderManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("customers");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isBookingPreviewOpen, setIsBookingPreviewOpen] = useState(false);
  const [isVehicleDetailsOpen, setIsVehicleDetailsOpen] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [fleetDrivers, setFleetDrivers] = useState([]);
  const [fleetRoutes, setFleetRoutes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busyRow, setBusyRow] = useState("");
  const [error, setError] = useState("");

  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [supportForm, setSupportForm] = useState(emptySupportForm);

  const [editingCustomerId, setEditingCustomerId] = useState("");
  const [editingOrderId, setEditingOrderId] = useState("");
  const [editingSupportId, setEditingSupportId] = useState("");

  const [editCustomer, setEditCustomer] = useState(emptyCustomerForm);
  const [editOrder, setEditOrder] = useState(emptyOrderForm);
  const [editSupport, setEditSupport] = useState(emptySupportForm);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sendInvoiceChecked, setSendInvoiceChecked] = useState(false);

  const filteredCustomers = useMemo(() => {
    const value = query.trim().toLowerCase();
    const sortByNewest = (items) => [...items].sort(
      (left, right) =>
        getTimestampValue(right.updatedAt || right.createdAt)
        - getTimestampValue(left.updatedAt || left.createdAt),
    );
    if (!value) return sortByNewest(customers);
    return sortByNewest(customers.filter(
      (row) =>
        row.orderNo.toLowerCase().includes(value) ||
        row.customerName.toLowerCase().includes(value) ||
        row.cargo.toLowerCase().includes(value) ||
        row.status.toLowerCase().includes(value),
    ));
  }, [customers, query]);

  const sortedOrders = useMemo(
    () => [...orders].sort(
      (left, right) =>
        getTimestampValue(right.updatedAt || right.createdAt)
        - getTimestampValue(left.updatedAt || left.createdAt),
    ),
    [orders],
  );

  const sortedSupportTickets = useMemo(
    () => [...supportTickets].sort(
      (left, right) =>
        getTimestampValue(right.updatedAt || right.createdAt)
        - getTimestampValue(left.updatedAt || left.createdAt),
    ),
    [supportTickets],
  );

  const selectedDriver = useMemo(
    () => fleetDrivers.find((driver) => driver.id === selectedDriverId) || null,
    [fleetDrivers, selectedDriverId],
  );

  const resolvedTruckId = selectedDriver?.assignedTruckId || selectedTruckId || "";

  const selectedTruck = useMemo(
    () => fleetVehicles.find((vehicle) => (
      vehicle.id === resolvedTruckId
      || vehicle.firestoreId === resolvedTruckId
      || vehicle.licensePlate === resolvedTruckId
      || (selectedDriver?.fullName && vehicle.driver?.trim().toLowerCase() === selectedDriver.fullName.trim().toLowerCase())
    )) || null,
    [fleetVehicles, resolvedTruckId, selectedDriver],
  );

  const selectedDriverRoutes = useMemo(
    () => fleetRoutes.filter((route) => route.assignedDriver === selectedDriver?.fullName),
    [fleetRoutes, selectedDriver],
  );

  const selectedRoute = useMemo(
    () => selectedDriverRoutes.find((route) => route.id === selectedRouteId) || null,
    [selectedDriverRoutes, selectedRouteId],
  );

  const selectedTruckMaintenanceSummary = useMemo(() => {
    if (!selectedTruck) {
      return { label: "Select a truck to review readiness", tone: "text-slate-400" };
    }

    if ((selectedTruck.status || "").toLowerCase() === "maintenance") {
      return { label: "Vehicle is currently marked under maintenance.", tone: "text-rose-300" };
    }

    if (selectedTruck.maintenanceDue) {
      const dueDate = new Date(selectedTruck.maintenanceDue);
      if (!Number.isNaN(dueDate.getTime()) && dueDate <= new Date()) {
        return { label: "Maintenance is due. Review before booking.", tone: "text-amber-300" };
      }
    }

    return { label: "Maintenance status looks ready for dispatch.", tone: "text-emerald-300" };
  }, [selectedTruck]);

  const selectedTruckDetails = useMemo(() => {
    if (!selectedTruck) {
      return [];
    }

    return [
      ["Vehicle ID", selectedTruck.id],
      ["Vehicle Type", selectedTruck.type || "Not set"],
      ["Make / Model", [selectedTruck.make, selectedTruck.model].filter(Boolean).join(" ") || "Not set"],
      ["Assigned Driver", selectedTruck.driver || "No driver linked"],
      ["Operational Status", selectedTruck.status || "Not set"],
      ["Maintenance Due", formatDateValue(selectedTruck.maintenanceDue)],
      ["Next Service Reminder", formatDateValue(selectedTruck.nextServiceReminder)],
      ["Plate Number", selectedTruck.licensePlate || "Not set"],
      ["Location", selectedTruck.location || "Not reporting"],
      ["Capacity", selectedTruck.capacityTonnage ? `${selectedTruck.capacityTonnage} tons` : "Not set"],
      ["Insurance", selectedTruck.insurance || "Not set"],
      ["Inspection Certificate", selectedTruck.inspectionCertificate || "Not set"],
      ["Permits", selectedTruck.permits || "Not set"],
      ["Registration License", selectedTruck.registrationLicense || "Not set"],
      ["Service History", selectedTruck.serviceHistory || "No maintenance note recorded yet.", "sm:col-span-2"],
    ];
  }, [selectedTruck]);

  const createAssignmentNotification = async ({
    title,
    message,
    orderNo,
    truckId,
    type,
  }) => {
    if (!orderNo || !truckId) {
      return;
    }

    await addDoc(collection(db, COLLECTIONS.notifications), {
      title,
      message,
      orderNo: orderNo.trim(),
      targetRole: "driver",
      targetTruckId: truckId.trim().toLowerCase(),
      type,
      createdAt: serverTimestamp(),
    });
  };

  const createOpsUserNotification = async ({
    title,
    message,
    customerUid,
    customerEmail,
    orderNo,
    quotationNo,
    type,
  }) => {
    await createNotificationRecord({
      title,
      message,
      targetUid: customerUid,
      targetEmail: customerEmail,
      orderNo,
      quotationNo,
      type,
    });
  };

  const loadCollections = async () => {
    setLoading(true);
    setError("");
    try {
      const [customerSnap, orderSnap, supportSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.customers)),
        getDocs(collection(db, COLLECTIONS.orders)),
        getDocs(collection(db, COLLECTIONS.support)),
      ]);

      setCustomers(customerSnap.docs.map(mapCustomerRecord));
      setOrders(orderSnap.docs.map(mapOrderRecord));
      setSupportTickets(supportSnap.docs.map(mapSupportRecord));
    } catch (loadError) {
      const message = loadError?.message || "Failed to fetch records.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();

    const unsubscribeCustomers = onSnapshot(
      collection(db, COLLECTIONS.customers),
      (snapshot) => {
        setCustomers(snapshot.docs.map(mapCustomerRecord));
        setLoading(false);
      },
      (snapshotError) => {
        const message = snapshotError?.message || "Failed to watch shipment orders.";
        setError(message);
        toast.error(message);
      },
    );

    const unsubscribeOrders = onSnapshot(
      collection(db, COLLECTIONS.orders),
      (snapshot) => {
        setOrders(snapshot.docs.map(mapOrderRecord));
      },
      (snapshotError) => {
        toast.error(snapshotError?.message || "Failed to watch tracking updates.");
      },
    );

    const unsubscribeSupport = onSnapshot(
      collection(db, COLLECTIONS.support),
      (snapshot) => {
        setSupportTickets(snapshot.docs.map(mapSupportRecord));
      },
      (snapshotError) => {
        toast.error(snapshotError?.message || "Failed to watch support updates.");
      },
    );

    const unsubscribeFleetVehicles = onSnapshot(
      collection(db, COLLECTIONS.fleetVehicles),
      (snapshot) => {
        const nextFleetVehicles = snapshot.docs.map((item) => {
          const data = item.data();
          return {
            firestoreId: normalizeIdentifier(item.id),
            id: normalizeIdentifier(data.id),
            driver: data.driver || "",
            type: data.type || "",
            make: data.make || "",
            model: data.model || "",
            licensePlate: normalizeIdentifier(data.licensePlate),
            status: data.status || "",
            location: data.location || "",
            capacityTonnage: data.capacityTonnage || "",
            maintenanceDue: data.maintenanceDue || "",
            nextServiceReminder: data.nextServiceReminder || "",
            serviceHistory: data.serviceHistory || "",
            registrationLicense: data.registrationLicense || "",
            insurance: data.insurance || "",
            permits: data.permits || "",
            inspectionCertificate: data.inspectionCertificate || "",
          };
        }).filter((vehicle) => vehicle.id || vehicle.firestoreId);
        setFleetVehicles(nextFleetVehicles);
      },
      (snapshotError) => {
        toast.error(snapshotError?.message || "Failed to watch fleet vehicles.");
      },
    );

    const unsubscribeFleetDrivers = onSnapshot(
      collection(db, COLLECTIONS.fleetDrivers),
      (snapshot) => {
        setFleetDrivers(snapshot.docs.map(mapDriverRecord).filter((driver) => driver.fullName));
      },
      (snapshotError) => {
        toast.error(snapshotError?.message || "Failed to watch fleet drivers.");
      },
    );

    const unsubscribeFleetRoutes = onSnapshot(
      collection(db, COLLECTIONS.fleetRoutes),
      (snapshot) => {
        setFleetRoutes(snapshot.docs.map(mapRouteRecord).filter((route) => route.routeName));
      },
      (snapshotError) => {
        toast.error(snapshotError?.message || "Failed to watch fleet routes.");
      },
    );

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
      unsubscribeSupport();
      unsubscribeFleetVehicles();
      unsubscribeFleetDrivers();
      unsubscribeFleetRoutes();
    };
  }, []);

  const addCustomer = async (event) => {
    event.preventDefault();
    if (!customerForm.orderNo || !customerForm.customerName || !customerForm.truckId || !customerForm.deliveryAddress) return;
    setBusyRow("customer-add");
    try {
      await addDoc(collection(db, COLLECTIONS.customers), {
        orderNo: customerForm.orderNo.trim(),
        customerName: customerForm.customerName.trim(),
        truckId: customerForm.truckId.trim(),
        deliveryAddress: customerForm.deliveryAddress.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await createAssignmentNotification({
        title: "New Assignment",
        message: `Order ${customerForm.orderNo.trim()} has been assigned to truck ${customerForm.truckId.trim().toUpperCase()}.`,
        orderNo: customerForm.orderNo,
        truckId: customerForm.truckId,
        type: "assignment_created",
      });
      setCustomerForm(emptyCustomerForm);
      await loadCollections();
      toast.success("Order created and assigned.");
    } catch (addError) {
      toast.error(addError?.message || "Failed to create order assignment.");
    } finally {
      setBusyRow("");
    }
  };

  const saveCustomerEdit = async (customerId) => {
    if (!editCustomer.orderNo || !editCustomer.customerName || !editCustomer.truckId || !editCustomer.deliveryAddress) return;
    setBusyRow(customerId);
    try {
      const previousAssignment = customers.find((row) => row.id === customerId);
      await updateDoc(doc(db, COLLECTIONS.customers, customerId), {
        orderNo: editCustomer.orderNo.trim(),
        customerName: editCustomer.customerName.trim(),
        truckId: editCustomer.truckId.trim(),
        deliveryAddress: editCustomer.deliveryAddress.trim(),
        updatedAt: serverTimestamp(),
      });
      await createAssignmentNotification({
        title: "Assignment Updated",
        message: `Order ${editCustomer.orderNo.trim()} is now assigned to truck ${editCustomer.truckId.trim().toUpperCase()}.`,
        orderNo: editCustomer.orderNo,
        truckId: editCustomer.truckId,
        type: "assignment_updated",
      });
      if (
        previousAssignment?.truckId
        && previousAssignment.truckId.trim().toLowerCase() !== editCustomer.truckId.trim().toLowerCase()
      ) {
        await createAssignmentNotification({
          title: "Assignment Reassigned",
          message: `Order ${editCustomer.orderNo.trim()} has been moved away from truck ${previousAssignment.truckId.trim().toUpperCase()}.`,
          orderNo: editCustomer.orderNo,
          truckId: previousAssignment.truckId,
          type: "assignment_removed",
        });
      }
      setEditingCustomerId("");
      await loadCollections();
      toast.success("Order assignment updated.");
    } catch (editError) {
      toast.error(editError?.message || "Failed to update order assignment.");
    } finally {
      setBusyRow("");
    }
  };

  const deleteCustomer = async (customerId) => {
    setBusyRow(customerId);
    try {
      const targetAssignment = customers.find((row) => row.id === customerId);
      await deleteDoc(doc(db, COLLECTIONS.customers, customerId));
      await createAssignmentNotification({
        title: "Assignment Removed",
        message: `Order ${targetAssignment?.orderNo || customerId} is no longer assigned to truck ${targetAssignment?.truckId || "N/A"}.`,
        orderNo: targetAssignment?.orderNo || customerId,
        truckId: targetAssignment?.truckId || "",
        type: "assignment_removed",
      });
      await loadCollections();
      toast.success("Order assignment deleted.");
    } catch (deleteError) {
      toast.error(deleteError?.message || "Failed to delete order assignment.");
    } finally {
      setBusyRow("");
    }
  };

  const openBookingPreview = (customer) => {
    const matchedDriver = fleetDrivers.find(
      (driver) => driver.assignedTruckId && driver.assignedTruckId === (customer.truckId || "").trim().toUpperCase(),
    );
    const matchedDriverRoutes = matchedDriver
      ? fleetRoutes.filter((route) => route.assignedDriver === matchedDriver.fullName)
      : [];

    setSelectedBooking(customer);
    setSelectedTruckId((customer.truckId || "").trim().toUpperCase());
    setSelectedDriverId(matchedDriver?.id || "");
    setSelectedRouteId(matchedDriverRoutes[0]?.id || "");
    setIsBookingPreviewOpen(true);
  };

  const closeBookingPreview = () => {
    setIsBookingPreviewOpen(false);
    setIsVehicleDetailsOpen(false);
    setSelectedBooking(null);
    setSelectedTruckId("");
    setSelectedDriverId("");
    setSelectedRouteId("");
    setSendInvoiceChecked(false);
  };

  useEffect(() => {
    if (!selectedDriver) {
      setSelectedTruckId("");
      setSelectedRouteId("");
      return;
    }

    setSelectedTruckId(selectedDriver.assignedTruckId || "");
    setSelectedRouteId((currentRouteId) => {
      if (selectedDriverRoutes.some((route) => route.id === currentRouteId)) {
        return currentRouteId;
      }
      return selectedDriverRoutes[0]?.id || "";
    });
  }, [selectedDriver, selectedDriverRoutes]);

  const bookShipment = async () => {
    if (!selectedBooking?.id) return;
    const bookingTruckId = selectedDriver?.assignedTruckId || selectedTruckId || "";
    if (!selectedDriver) {
      toast.error("Select a driver before booking this shipment.");
      return;
    }
    if (!bookingTruckId) {
      toast.error("The selected driver does not have an attached truck yet.");
      return;
    }
    if (!selectedRoute) {
      toast.error("Select one of the routes attached to this driver before booking.");
      return;
    }
    setBusyRow(`book-${selectedBooking.id}`);
    try {
      let routeMetrics = null;
      if (
        isGoogleMapsConfigured()
        && selectedBooking.origin?.coordinates
        && selectedBooking.destination?.coordinates
      ) {
        try {
          routeMetrics = await computeRouteMetrics({
            originCoordinates: selectedBooking.origin.coordinates,
            destinationCoordinates: selectedBooking.destination.coordinates,
          });
        } catch (routeError) {
          toast.info(routeError?.message || "Route metrics could not be synced, so booking will continue without Google ETA.");
        }
      }

      const nextEta = routeMetrics?.durationMinutes
        ? formatEtaFromMinutes(routeMetrics.durationMinutes)
        : selectedBooking.eta || "";

      await updateDoc(doc(db, COLLECTIONS.customers, selectedBooking.id), {
        assignedDriverId: selectedDriver.id,
        assignedDriverName: selectedDriver.fullName,
        assignedRouteId: selectedRoute.id,
        assignedRouteName: selectedRoute.routeName,
        truckId: bookingTruckId,
        status: sendInvoiceChecked ? "Shipment Booked" : "Truck Assigned",
        eta: nextEta,
        routeDistanceKm: routeMetrics?.distanceKm || selectedBooking.routeDistanceKm || 0,
        routeDurationMinutes: routeMetrics?.durationMinutes || selectedBooking.routeDurationMinutes || 0,
        routePolyline: routeMetrics?.polyline || selectedBooking.routePolyline || "",
        routeSource: routeMetrics?.source || selectedBooking.routeSource || "",
        updatedAt: serverTimestamp(),
      });
      await createAssignmentNotification({
        title: "Truck Assignment",
        message: `Order ${selectedBooking.orderNo} has been assigned to ${selectedDriver.fullName} on route ${selectedRoute.routeName} with truck ${bookingTruckId.toUpperCase()}.`,
        orderNo: selectedBooking.orderNo,
        truckId: bookingTruckId,
        type: "assignment_created",
      });
      await createOpsUserNotification({
        title: sendInvoiceChecked ? "Shipment Booked And Invoice Sent" : "Shipment Booked",
        message: sendInvoiceChecked
          ? `Order ${selectedBooking.orderNo} has been booked and your invoice is now available${nextEta ? ` with ETA ${nextEta}` : ""}.`
          : `Order ${selectedBooking.orderNo} has been booked with driver ${selectedDriver.fullName} on route ${selectedRoute.routeName}${nextEta ? ` with ETA ${nextEta}` : ""}.`,
        customerUid: selectedBooking.customerUid || "",
        customerEmail: selectedBooking.customerEmail || "",
        orderNo: selectedBooking.orderNo,
        quotationNo: selectedBooking.quotationNo || "",
        type: sendInvoiceChecked ? "shipment_booked_invoice_sent" : "shipment_booked",
      });
      toast.success(
        sendInvoiceChecked
          ? `Shipment booked and invoice sent for order ${selectedBooking.orderNo}.`
          : `Shipment booked for order ${selectedBooking.orderNo}.`,
      );
      closeBookingPreview();
    } catch (bookingError) {
      toast.error(bookingError?.message || "Failed to book shipment.");
    } finally {
      setBusyRow("");
    }
  };

  const addOrder = async (event) => {
    event.preventDefault();
    if (!orderForm.orderNo || !orderForm.truckId || !orderForm.location || !orderForm.eta) return;
    setBusyRow("order-add");
    try {
      await addDoc(collection(db, COLLECTIONS.orders), {
        orderNo: orderForm.orderNo.trim(),
        truckId: orderForm.truckId.trim(),
        location: orderForm.location.trim(),
        eta: orderForm.eta.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setOrderForm(emptyOrderForm);
      await loadCollections();
      toast.success("Tracking update added.");
    } catch (addError) {
      toast.error(addError?.message || "Failed to add tracking update.");
    } finally {
      setBusyRow("");
    }
  };

  const saveOrderEdit = async (orderId) => {
    if (!editOrder.orderNo || !editOrder.truckId || !editOrder.location || !editOrder.eta) return;
    setBusyRow(orderId);
    try {
      await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
        orderNo: editOrder.orderNo.trim(),
        truckId: editOrder.truckId.trim(),
        location: editOrder.location.trim(),
        eta: editOrder.eta.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingOrderId("");
      await loadCollections();
      toast.success("Tracking update saved.");
    } catch (editError) {
      toast.error(editError?.message || "Failed to update tracking update.");
    } finally {
      setBusyRow("");
    }
  };

  const deleteOrder = async (orderId) => {
    setBusyRow(orderId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.orders, orderId));
      await loadCollections();
      toast.success("Tracking update deleted.");
    } catch (deleteError) {
      toast.error(deleteError?.message || "Failed to delete tracking update.");
    } finally {
      setBusyRow("");
    }
  };

  const addSupport = async (event) => {
    event.preventDefault();
    if (!supportForm.deliveryNo || !supportForm.orderNo || !supportForm.confirmation || !supportForm.feedback) return;
    setBusyRow("support-add");
    try {
      await addDoc(collection(db, COLLECTIONS.support), {
        deliveryNo: supportForm.deliveryNo.trim(),
        orderNo: supportForm.orderNo.trim(),
        confirmation: supportForm.confirmation.trim(),
        feedback: supportForm.feedback.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSupportForm(emptySupportForm);
      await loadCollections();
      toast.success("Delivery confirmation captured.");
    } catch (addError) {
      toast.error(addError?.message || "Failed to save delivery confirmation.");
    } finally {
      setBusyRow("");
    }
  };

  const saveSupportEdit = async (supportId) => {
    if (!editSupport.deliveryNo || !editSupport.orderNo || !editSupport.confirmation || !editSupport.feedback) return;
    setBusyRow(supportId);
    try {
      await updateDoc(doc(db, COLLECTIONS.support, supportId), {
        deliveryNo: editSupport.deliveryNo.trim(),
        orderNo: editSupport.orderNo.trim(),
        confirmation: editSupport.confirmation.trim(),
        feedback: editSupport.feedback.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingSupportId("");
      await loadCollections();
      toast.success("Delivery feedback updated.");
    } catch (editError) {
      toast.error(editError?.message || "Failed to update delivery feedback.");
    } finally {
      setBusyRow("");
    }
  };

  const deleteSupport = async (supportId) => {
    setBusyRow(supportId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.support, supportId));
      await loadCollections();
      toast.success("Delivery feedback deleted.");
    } catch (deleteError) {
      toast.error(deleteError?.message || "Failed to delete delivery feedback.");
    } finally {
      setBusyRow("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <NavBar title="Order Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 p-4 lg:p-8 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Order Management</p>
              
              {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
            </header>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-2 sm:p-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("customers")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "customers"
                      ? "bg-orange-600 text-white"
                      : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Shipment Management
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "orders"
                      ? "bg-orange-600 text-white"
                      : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Real-time Tracking & Updates
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "support"
                      ? "bg-orange-600 text-white"
                      : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Delivery Confirmation & Feedback
                </button>
              </div>
            </div>

            {activeTab === "customers" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Users className="text-orange-400" size={18} />
                    <h2 className="text-lg font-semibold text-white">Customer Shipment Orders</h2>
                  </div>
                </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" placeholder="Search order no, customer, cargo, or status..." />
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-3 py-2">Order No</th>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Cargo</th>
                      <th className="px-3 py-2">Weight</th>
                      <th className="px-3 py-2">Origin</th>
                      <th className="px-3 py-2">Destination</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="px-3 py-4 text-slate-500">Loading...</td></tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr><td colSpan={9} className="px-3 py-4 text-slate-500">No shipment orders.</td></tr>
                    ) : (
                      filteredCustomers.map((row) => (
                        <tr key={row.id} className="border-t border-slate-800">
                          <td className="px-3 py-3 text-white">{row.orderNo}</td>
                          <td className="px-3 py-3 text-slate-400">{formatTimestamp(row)}</td>
                          <td className="px-3 py-3 text-slate-300">{row.customerName}</td>
                          <td className="px-3 py-3 text-slate-300">{row.cargo || "Not specified"}</td>
                          <td className="px-3 py-3 text-slate-400">{row.weight || "Not specified"}</td>
                          <td className="px-3 py-3 text-slate-400">{formatLocation(row.origin)}</td>
                          <td className="px-3 py-3 text-slate-400">{formatLocation(row.destination)}</td>
                          <td className="px-3 py-3 text-slate-300">{row.status}</td>
                           <td className="px-3 py-3">
                             <div className="flex items-center gap-2 flex-wrap">
                               <button type="button" onClick={() => openBookingPreview(row)} disabled={busyRow === row.id} className="inline-flex items-center gap-1 rounded-md border border-orange-500/40 px-2 py-1 text-xs text-orange-300 hover:bg-orange-500/10">
                                  <Trash2 size={12} /> Book Shipment
                                </button>
                                {row.status === "Shipment Booked" ? (
                                  <button type="button" onClick={() => setSelectedInvoice(row)} className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-100 hover:bg-slate-800">
                                    <Printer size={12} /> Print
                                  </button>
                                ) : null}
                                <button type="button" onClick={() => deleteCustomer(row.id)} disabled={busyRow === row.id} className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-60">
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>
              </section>
            ) : null}

            {activeTab === "orders" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Truck className="text-orange-400" size={18} />
                  <h2 className="text-lg font-semibold text-white">Real-time Tracking & Updates</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <Plus size={14} />
                  Add Tracking Update
                </button>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-3 py-2">Order No</th>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Truck ID</th>
                      <th className="px-3 py-2">Current Location</th>
                      <th className="px-3 py-2">ETA</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((row) => (
                      <tr key={row.id} className="border-t border-slate-800">
                        <td className="px-3 py-3 text-white">
                          {editingOrderId === row.id ? (
                            <input value={editOrder.orderNo} onChange={(e) => setEditOrder((p) => ({ ...p, orderNo: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                          ) : row.orderNo}
                        </td>
                        <td className="px-3 py-3 text-slate-400">{formatTimestamp(row)}</td>
                        <td className="px-3 py-3 text-slate-300">
                          {editingOrderId === row.id ? (
                            <input value={editOrder.truckId} onChange={(e) => setEditOrder((p) => ({ ...p, truckId: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                          ) : row.truckId}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {editingOrderId === row.id ? (
                            <input value={editOrder.location} onChange={(e) => setEditOrder((p) => ({ ...p, location: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                          ) : row.location}
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {editingOrderId === row.id ? (
                            <input value={editOrder.eta} onChange={(e) => setEditOrder((p) => ({ ...p, eta: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                          ) : row.eta}
                        </td>
                        <td className="px-3 py-3">
                          {editingOrderId === row.id ? (
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => saveOrderEdit(row.id)} disabled={busyRow === row.id} className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Save</button>
                              <button type="button" onClick={() => setEditingOrderId("")} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => { setEditingOrderId(row.id); setEditOrder({ orderNo: row.orderNo, truckId: row.truckId, location: row.location, eta: row.eta }); }} className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
                                <Pencil size={12} /> Edit
                              </button>
                              <button type="button" onClick={() => deleteOrder(row.id)} disabled={busyRow === row.id} className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10">
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </section>
            ) : null}

            {activeTab === "support" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="text-orange-400" size={18} />
                  <h2 className="text-lg font-semibold text-white">Delivery Confirmation and Feedback</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <Plus size={14} />
                  Add Confirmation
                </button>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-3 py-2">Delivery No</th>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Order No</th>
                      <th className="px-3 py-2">Confirmation</th>
                      <th className="px-3 py-2">Feedback</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSupportTickets.map((row) => (
                        <tr key={row.id} className="border-t border-slate-800">
                          <td className="px-3 py-3 text-white">
                            {editingSupportId === row.id ? (
                              <input value={editSupport.deliveryNo} onChange={(e) => setEditSupport((p) => ({ ...p, deliveryNo: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.deliveryNo}
                          </td>
                          <td className="px-3 py-3 text-slate-400">{formatTimestamp(row)}</td>
                          <td className="px-3 py-3 text-slate-300">
                            {editingSupportId === row.id ? (
                              <input value={editSupport.orderNo} onChange={(e) => setEditSupport((p) => ({ ...p, orderNo: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.orderNo}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {editingSupportId === row.id ? (
                              <input value={editSupport.confirmation} onChange={(e) => setEditSupport((p) => ({ ...p, confirmation: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.confirmation}
                          </td>
                          <td className="px-3 py-3 text-slate-400">
                            {editingSupportId === row.id ? (
                              <input value={editSupport.feedback} onChange={(e) => setEditSupport((p) => ({ ...p, feedback: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.feedback}
                          </td>
                          <td className="px-3 py-3">
                            {editingSupportId === row.id ? (
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => saveSupportEdit(row.id)} disabled={busyRow === row.id} className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Save</button>
                                <button type="button" onClick={() => setEditingSupportId("")} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { setEditingSupportId(row.id); setEditSupport({ deliveryNo: row.deliveryNo, orderNo: row.orderNo, confirmation: row.confirmation, feedback: row.feedback }); }} className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
                                  <Pencil size={12} /> Edit
                                </button>
                                <button type="button" onClick={() => deleteSupport(row.id)} disabled={busyRow === row.id} className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10">
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              </section>
            ) : null}

            {isCustomerModalOpen ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Create Order</h3>
                    <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Close</button>
                  </div>
                  <form
                    onSubmit={async (event) => {
                      await addCustomer(event);
                      if (busyRow !== "customer-add") setIsCustomerModalOpen(false);
                    }}
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    <input value={customerForm.orderNo} onChange={(e) => setCustomerForm((p) => ({ ...p, orderNo: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Order No" required />
                    <input value={customerForm.customerName} onChange={(e) => setCustomerForm((p) => ({ ...p, customerName: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Customer Name" required />
                    <input value={customerForm.truckId} onChange={(e) => setCustomerForm((p) => ({ ...p, truckId: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Assigned Truck ID" required />
                    <input value={customerForm.deliveryAddress} onChange={(e) => setCustomerForm((p) => ({ ...p, deliveryAddress: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Delivery Address" required />
                    <button type="submit" disabled={busyRow === "customer-add"} className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
                      {busyRow === "customer-add" ? "Adding..." : "Create Order"}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            {isOrderModalOpen ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Add Tracking Update</h3>
                    <button type="button" onClick={() => setIsOrderModalOpen(false)} className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Close</button>
                  </div>
                  <form
                    onSubmit={async (event) => {
                      await addOrder(event);
                      if (busyRow !== "order-add") setIsOrderModalOpen(false);
                    }}
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    <input value={orderForm.orderNo} onChange={(e) => setOrderForm((p) => ({ ...p, orderNo: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Order No" required />
                    <input value={orderForm.truckId} onChange={(e) => setOrderForm((p) => ({ ...p, truckId: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Truck ID" required />
                    <input value={orderForm.location} onChange={(e) => setOrderForm((p) => ({ ...p, location: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Current Location" required />
                    <input value={orderForm.eta} onChange={(e) => setOrderForm((p) => ({ ...p, eta: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="ETA" required />
                    <button type="submit" disabled={busyRow === "order-add"} className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
                      {busyRow === "order-add" ? "Adding..." : "Add Tracking Update"}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            {isSupportModalOpen ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Add Delivery Confirmation</h3>
                    <button type="button" onClick={() => setIsSupportModalOpen(false)} className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Close</button>
                  </div>
                  <form
                    onSubmit={async (event) => {
                      await addSupport(event);
                      if (busyRow !== "support-add") setIsSupportModalOpen(false);
                    }}
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    <input value={supportForm.deliveryNo} onChange={(e) => setSupportForm((p) => ({ ...p, deliveryNo: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Delivery No" required />
                    <input value={supportForm.orderNo} onChange={(e) => setSupportForm((p) => ({ ...p, orderNo: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Order No" required />
                    <input value={supportForm.confirmation} onChange={(e) => setSupportForm((p) => ({ ...p, confirmation: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Confirmation Status" required />
                    <input value={supportForm.feedback} onChange={(e) => setSupportForm((p) => ({ ...p, feedback: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Customer Feedback" required />
                    <button type="submit" disabled={busyRow === "support-add"} className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
                      {busyRow === "support-add" ? "Adding..." : "Add Confirmation"}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            {isBookingPreviewOpen && selectedBooking ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Order Preview</h3>
                      <p className="mt-1 text-sm text-slate-400">Review this shipment before invoicing or assigning a truck.</p>
                    </div>
                    <button type="button" onClick={closeBookingPreview} className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Close</button>
                  </div>
                  <div className="mt-4 max-h-[68vh] overflow-y-auto pr-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Order No", selectedBooking.orderNo],
                      ["Customer", selectedBooking.customerName],
                      ["Cargo", selectedBooking.cargo || "Not specified"],
                      ["Weight", selectedBooking.weight || "Not specified"],
                      ["Origin", formatLocation(selectedBooking.origin)],
                      ["Destination", formatLocation(selectedBooking.destination)],
                      ["Delivery Address", selectedBooking.deliveryAddress || "Not available"],
                      ["Status", selectedBooking.status],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Assigned Driver</p>
                      <select value={selectedDriverId} onChange={(event) => setSelectedDriverId(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500">
                        <option value="">Select driver</option>
                        {fleetDrivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.fullName}
                          </option>
                        ))}
                      </select>
                      {selectedDriver ? (
                        <div className="mt-3 space-y-1 text-xs text-slate-400">
                          <p>Status: <span className="font-semibold text-slate-200">{selectedDriver.assignmentStatus}</span></p>
                          <p>Territory: <span className="font-semibold text-slate-200">{selectedDriver.territory || "Not set"}</span></p>
                          <p>Attached Truck: <span className="font-semibold text-slate-200">{selectedDriver.assignedTruckId || "Not attached"}</span></p>
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Routes Attached To Driver</p>
                      <select
                        value={selectedRouteId}
                        onChange={(event) => setSelectedRouteId(event.target.value)}
                        disabled={!selectedDriverRoutes.length}
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {selectedDriver ? (selectedDriverRoutes.length ? "Select route" : "No route attached") : "Select driver first"}
                        </option>
                        {selectedDriverRoutes.map((route) => (
                          <option key={route.id} value={route.id}>
                            {route.routeName}
                          </option>
                        ))}
                      </select>
                      {selectedRoute ? (
                        <div className="mt-3 space-y-1 text-xs text-slate-400">
                          <p>Path: <span className="font-semibold text-slate-200">{selectedRoute.route || selectedRoute.path.join(" -> ") || "Not set"}</span></p>
                          <p>Distance: <span className="font-semibold text-slate-200">{selectedRoute.distance || "Not set"}</span></p>
                          <p>ETA Plan: <span className="font-semibold text-slate-200">{selectedRoute.estimatedTime || "Not set"}</span></p>
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Selected Vehicle</p>
                      {selectedTruck ? (
                        <div className="mt-2 space-y-2 text-sm text-slate-300">
                          <p className="font-semibold text-white">
                            {[selectedTruck.make, selectedTruck.model].filter(Boolean).join(" ")}
                            {selectedTruck.type ? ` (${selectedTruck.type})` : ""}
                          </p>
                          <p>Driver: <span className="font-semibold text-white">{selectedTruck.driver || "No driver linked"}</span></p>
                          <p>Plate No: <span className="font-semibold text-white">{selectedTruck.licensePlate || "Not set"}</span></p>
                          <p>Status: <span className="font-semibold text-white">{selectedTruck.status || "Not set"}</span></p>
                          <p>Location: <span className="font-semibold text-white">{selectedTruck.location || "Not reporting"}</span></p>
                          <p>Capacity: <span className="font-semibold text-white">{selectedTruck.capacityTonnage ? `${selectedTruck.capacityTonnage} tons` : "Not set"}</span></p>
                          <p className={selectedTruckMaintenanceSummary.tone}>{selectedTruckMaintenanceSummary.label}</p>
                          <button
                            type="button"
                            onClick={() => setIsVehicleDetailsOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-200 transition hover:border-orange-400 hover:bg-orange-500/20"
                          >
                            <Eye size={14} />
                            View more vehicle details
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm font-semibold text-white">No vehicle selected</p>
                      )}
                    </div>
                  </div>
                  <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={sendInvoiceChecked}
                      onChange={(event) => setSendInvoiceChecked(event.target.checked)}
                      disabled={busyRow === `book-${selectedBooking.id}`}
                      className="h-4 w-4 rounded border-orange-400 bg-slate-950 text-orange-500 focus:ring-orange-500"
                    />
                    <span>Send invoice to client together with the shipment order</span>
                  </label>
                  {!selectedDriver ? <p className="mt-4 text-sm text-amber-300">Select a driver to load the attached route and vehicle before booking.</p> : null}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={bookShipment} disabled={!selectedDriver || !selectedRoute || !resolvedTruckId || busyRow === `book-${selectedBooking.id}`} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
                      {busyRow === `book-${selectedBooking.id}` ? "Booking..." : "Book Shipment"}
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            ) : null}
            {isVehicleDetailsOpen && selectedTruck ? (
              <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4">
                <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Vehicle Readiness Details</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Review maintenance and compliance details before confirming shipment booking.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVehicleDetailsOpen(false)}
                      className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Dispatch Readiness</p>
                    <p className={`mt-2 text-sm font-semibold ${selectedTruckMaintenanceSummary.tone}`}>
                      {selectedTruckMaintenanceSummary.label}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {selectedTruckDetails.map(([label, value, span = ""]) => (
                      <div key={label} className={`rounded-xl border border-slate-800 bg-slate-950/60 p-4 ${span}`}>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <InvoicePreviewModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderManagement;
