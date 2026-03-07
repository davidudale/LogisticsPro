import React, { useEffect, useMemo, useState } from "react";
import { MessageSquare, Pencil, Plus, Search, Trash2, Truck, Users } from "lucide-react";
import { toast } from "react-toastify";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";
import { app } from "../../Auth/firebase";

const db = getFirestore(app);

const COLLECTIONS = {
  customers: "customers",
  orders: "customer_orders",
  support: "customer_support",
};

const emptyCustomerForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
};

const emptyOrderForm = {
  orderNo: "",
  customerName: "",
  status: "",
  eta: "",
};

const emptySupportForm = {
  ticketNo: "",
  customerName: "",
  topic: "",
  state: "",
};

const CustomerManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("customers");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);

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

  const filteredCustomers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return customers;
    return customers.filter(
      (customer) =>
        customer.companyName.toLowerCase().includes(value) ||
        customer.contactName.toLowerCase().includes(value) ||
        customer.email.toLowerCase().includes(value),
    );
  }, [customers, query]);

  const loadCollections = async () => {
    setLoading(true);
    setError("");
    try {
      const [customerSnap, orderSnap, supportSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.customers)),
        getDocs(collection(db, COLLECTIONS.orders)),
        getDocs(collection(db, COLLECTIONS.support)),
      ]);

      setCustomers(
        customerSnap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            companyName: data.companyName || data.company || "",
            contactName: data.contactName || data.contact || "",
            email: data.email || "",
            phone: data.phone || "",
          };
        }),
      );

      setOrders(
        orderSnap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            orderNo: data.orderNo || data.id || "",
            customerName: data.customerName || data.customer || "",
            status: data.status || "Created",
            eta: data.eta || "TBD",
          };
        }),
      );

      setSupportTickets(
        supportSnap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            ticketNo: data.ticketNo || data.id || "",
            customerName: data.customerName || data.customer || "",
            topic: data.topic || "",
            state: data.state || "Open",
          };
        }),
      );
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
  }, []);

  const addCustomer = async (event) => {
    event.preventDefault();
    if (!customerForm.companyName || !customerForm.contactName || !customerForm.email || !customerForm.phone) return;
    setBusyRow("customer-add");
    try {
      await addDoc(collection(db, COLLECTIONS.customers), {
        companyName: customerForm.companyName.trim(),
        contactName: customerForm.contactName.trim(),
        email: customerForm.email.trim().toLowerCase(),
        phone: customerForm.phone.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCustomerForm(emptyCustomerForm);
      await loadCollections();
      toast.success("Customer added successfully.");
    } catch (addError) {
      toast.error(addError?.message || "Failed to add customer.");
    } finally {
      setBusyRow("");
    }
  };

  const saveCustomerEdit = async (customerId) => {
    if (!editCustomer.companyName || !editCustomer.contactName || !editCustomer.email || !editCustomer.phone) return;
    setBusyRow(customerId);
    try {
      await updateDoc(doc(db, COLLECTIONS.customers, customerId), {
        companyName: editCustomer.companyName.trim(),
        contactName: editCustomer.contactName.trim(),
        email: editCustomer.email.trim().toLowerCase(),
        phone: editCustomer.phone.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingCustomerId("");
      await loadCollections();
      toast.success("Customer updated successfully.");
    } catch (editError) {
      toast.error(editError?.message || "Failed to update customer.");
    } finally {
      setBusyRow("");
    }
  };

  const deleteCustomer = async (customerId) => {
    setBusyRow(customerId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.customers, customerId));
      await loadCollections();
      toast.success("Customer deleted.");
    } catch (deleteError) {
      toast.error(deleteError?.message || "Failed to delete customer.");
    } finally {
      setBusyRow("");
    }
  };

  const addOrder = async (event) => {
    event.preventDefault();
    if (!orderForm.orderNo || !orderForm.customerName || !orderForm.status || !orderForm.eta) return;
    setBusyRow("order-add");
    try {
      await addDoc(collection(db, COLLECTIONS.orders), {
        orderNo: orderForm.orderNo.trim(),
        customerName: orderForm.customerName.trim(),
        status: orderForm.status.trim(),
        eta: orderForm.eta.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setOrderForm(emptyOrderForm);
      await loadCollections();
      toast.success("Order record added.");
    } catch (addError) {
      toast.error(addError?.message || "Failed to add order record.");
    } finally {
      setBusyRow("");
    }
  };

  const saveOrderEdit = async (orderId) => {
    if (!editOrder.orderNo || !editOrder.customerName || !editOrder.status || !editOrder.eta) return;
    setBusyRow(orderId);
    try {
      await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
        orderNo: editOrder.orderNo.trim(),
        customerName: editOrder.customerName.trim(),
        status: editOrder.status.trim(),
        eta: editOrder.eta.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingOrderId("");
      await loadCollections();
      toast.success("Order record updated.");
    } catch (editError) {
      toast.error(editError?.message || "Failed to update order record.");
    } finally {
      setBusyRow("");
    }
  };

  const deleteOrder = async (orderId) => {
    setBusyRow(orderId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.orders, orderId));
      await loadCollections();
      toast.success("Order record deleted.");
    } catch (deleteError) {
      toast.error(deleteError?.message || "Failed to delete order record.");
    } finally {
      setBusyRow("");
    }
  };

  const addSupport = async (event) => {
    event.preventDefault();
    if (!supportForm.ticketNo || !supportForm.customerName || !supportForm.topic || !supportForm.state) return;
    setBusyRow("support-add");
    try {
      await addDoc(collection(db, COLLECTIONS.support), {
        ticketNo: supportForm.ticketNo.trim(),
        customerName: supportForm.customerName.trim(),
        topic: supportForm.topic.trim(),
        state: supportForm.state.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSupportForm(emptySupportForm);
      await loadCollections();
      toast.success("Support record added.");
    } catch (addError) {
      toast.error(addError?.message || "Failed to add support record.");
    } finally {
      setBusyRow("");
    }
  };

  const saveSupportEdit = async (supportId) => {
    if (!editSupport.ticketNo || !editSupport.customerName || !editSupport.topic || !editSupport.state) return;
    setBusyRow(supportId);
    try {
      await updateDoc(doc(db, COLLECTIONS.support, supportId), {
        ticketNo: editSupport.ticketNo.trim(),
        customerName: editSupport.customerName.trim(),
        topic: editSupport.topic.trim(),
        state: editSupport.state.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingSupportId("");
      await loadCollections();
      toast.success("Support record updated.");
    } catch (editError) {
      toast.error(editError?.message || "Failed to update support record.");
    } finally {
      setBusyRow("");
    }
  };

  const deleteSupport = async (supportId) => {
    setBusyRow(supportId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.support, supportId));
      await loadCollections();
      toast.success("Support record deleted.");
    } catch (deleteError) {
      toast.error(deleteError?.message || "Failed to delete support record.");
    } finally {
      setBusyRow("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <NavBar title="Customer Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 p-4 lg:p-8 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer Management</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Customer onboarding and service operations</h1>
              <p className="mt-2 text-sm text-slate-400">
                Firestore collections: <span className="text-orange-400">customers</span>, <span className="text-orange-400">customer_orders</span>, and <span className="text-orange-400">customer_support</span>.
              </p>
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
                  Customer Profiles
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
                  Order Tracking
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
                  Feedback & Support
                </button>
              </div>
            </div>

            {activeTab === "customers" ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Users className="text-orange-400" size={18} />
                    <h2 className="text-lg font-semibold text-white">Customer Profiles</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                  >
                    <Plus size={14} />
                    Add Customer
                  </button>
                </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" placeholder="Search company, contact, or email..." />
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-3 py-2">Company</th>
                      <th className="px-3 py-2">Contact</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="px-3 py-4 text-slate-500">Loading...</td></tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-4 text-slate-500">No customer records.</td></tr>
                    ) : (
                      filteredCustomers.map((row) => (
                        <tr key={row.id} className="border-t border-slate-800">
                          <td className="px-3 py-3">
                            {editingCustomerId === row.id ? (
                              <input value={editCustomer.companyName} onChange={(e) => setEditCustomer((p) => ({ ...p, companyName: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.companyName}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {editingCustomerId === row.id ? (
                              <input value={editCustomer.contactName} onChange={(e) => setEditCustomer((p) => ({ ...p, contactName: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.contactName}
                          </td>
                          <td className="px-3 py-3 text-slate-400">
                            {editingCustomerId === row.id ? (
                              <input value={editCustomer.email} onChange={(e) => setEditCustomer((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.email}
                          </td>
                          <td className="px-3 py-3 text-slate-400">
                            {editingCustomerId === row.id ? (
                              <input value={editCustomer.phone} onChange={(e) => setEditCustomer((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.phone}
                          </td>
                          <td className="px-3 py-3">
                            {editingCustomerId === row.id ? (
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => saveCustomerEdit(row.id)} disabled={busyRow === row.id} className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Save</button>
                                <button type="button" onClick={() => setEditingCustomerId("")} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { setEditingCustomerId(row.id); setEditCustomer({ companyName: row.companyName, contactName: row.contactName, email: row.email, phone: row.phone }); }} className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
                                  <Pencil size={12} /> Edit
                                </button>
                                <button type="button" onClick={() => deleteCustomer(row.id)} disabled={busyRow === row.id} className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10">
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            )}
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
                  <h2 className="text-lg font-semibold text-white">Order Tracking and Updates</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <Plus size={14} />
                  Add Order
                </button>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">ETA</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((row) => (
                      <tr key={row.id} className="border-t border-slate-800">
                        <td className="px-3 py-3 text-white">
                          {editingOrderId === row.id ? (
                            <input value={editOrder.orderNo} onChange={(e) => setEditOrder((p) => ({ ...p, orderNo: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                          ) : row.orderNo}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {editingOrderId === row.id ? (
                            <input value={editOrder.customerName} onChange={(e) => setEditOrder((p) => ({ ...p, customerName: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                          ) : row.customerName}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {editingOrderId === row.id ? (
                            <input value={editOrder.status} onChange={(e) => setEditOrder((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                          ) : row.status}
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
                              <button type="button" onClick={() => { setEditingOrderId(row.id); setEditOrder({ orderNo: row.orderNo, customerName: row.customerName, status: row.status, eta: row.eta }); }} className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
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
                  <h2 className="text-lg font-semibold text-white">Feedback and Support</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <Plus size={14} />
                  Add Ticket
                </button>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-3 py-2">Ticket</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Topic</th>
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportTickets.map((row) => (
                        <tr key={row.id} className="border-t border-slate-800">
                          <td className="px-3 py-3 text-white">
                            {editingSupportId === row.id ? (
                              <input value={editSupport.ticketNo} onChange={(e) => setEditSupport((p) => ({ ...p, ticketNo: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.ticketNo}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {editingSupportId === row.id ? (
                              <input value={editSupport.customerName} onChange={(e) => setEditSupport((p) => ({ ...p, customerName: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.customerName}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {editingSupportId === row.id ? (
                              <input value={editSupport.topic} onChange={(e) => setEditSupport((p) => ({ ...p, topic: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.topic}
                          </td>
                          <td className="px-3 py-3 text-slate-400">
                            {editingSupportId === row.id ? (
                              <input value={editSupport.state} onChange={(e) => setEditSupport((p) => ({ ...p, state: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 outline-none focus:border-orange-500" />
                            ) : row.state}
                          </td>
                          <td className="px-3 py-3">
                            {editingSupportId === row.id ? (
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => saveSupportEdit(row.id)} disabled={busyRow === row.id} className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Save</button>
                                <button type="button" onClick={() => setEditingSupportId("")} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { setEditingSupportId(row.id); setEditSupport({ ticketNo: row.ticketNo, customerName: row.customerName, topic: row.topic, state: row.state }); }} className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
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
                <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Add Customer</h3>
                    <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Close</button>
                  </div>
                  <form
                    onSubmit={async (event) => {
                      await addCustomer(event);
                      if (busyRow !== "customer-add") setIsCustomerModalOpen(false);
                    }}
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    <input value={customerForm.companyName} onChange={(e) => setCustomerForm((p) => ({ ...p, companyName: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Company" required />
                    <input value={customerForm.contactName} onChange={(e) => setCustomerForm((p) => ({ ...p, contactName: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Contact" required />
                    <input type="email" value={customerForm.email} onChange={(e) => setCustomerForm((p) => ({ ...p, email: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Email" required />
                    <input value={customerForm.phone} onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Phone" required />
                    <button type="submit" disabled={busyRow === "customer-add"} className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
                      {busyRow === "customer-add" ? "Adding..." : "Add Customer"}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            {isOrderModalOpen ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Add Order</h3>
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
                    <input value={orderForm.customerName} onChange={(e) => setOrderForm((p) => ({ ...p, customerName: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Customer" required />
                    <input value={orderForm.status} onChange={(e) => setOrderForm((p) => ({ ...p, status: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Status" required />
                    <input value={orderForm.eta} onChange={(e) => setOrderForm((p) => ({ ...p, eta: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="ETA" required />
                    <button type="submit" disabled={busyRow === "order-add"} className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
                      {busyRow === "order-add" ? "Adding..." : "Add Order"}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            {isSupportModalOpen ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Add Support Ticket</h3>
                    <button type="button" onClick={() => setIsSupportModalOpen(false)} className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Close</button>
                  </div>
                  <form
                    onSubmit={async (event) => {
                      await addSupport(event);
                      if (busyRow !== "support-add") setIsSupportModalOpen(false);
                    }}
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    <input value={supportForm.ticketNo} onChange={(e) => setSupportForm((p) => ({ ...p, ticketNo: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Ticket No" required />
                    <input value={supportForm.customerName} onChange={(e) => setSupportForm((p) => ({ ...p, customerName: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Customer" required />
                    <input value={supportForm.topic} onChange={(e) => setSupportForm((p) => ({ ...p, topic: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="Topic" required />
                    <input value={supportForm.state} onChange={(e) => setSupportForm((p) => ({ ...p, state: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500" placeholder="State" required />
                    <button type="submit" disabled={busyRow === "support-add"} className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
                      {busyRow === "support-add" ? "Adding..." : "Add Ticket"}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerManagement;
