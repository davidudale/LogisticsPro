import React, { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { ClipboardList } from "lucide-react";
import { toast } from "react-toastify";
import { app } from "../../Auth/firebase";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const db = getFirestore(app);

const formatLocation = (location) => {
  if (!location || typeof location !== "object") return "Not available";
  return [location.address, location.lga, location.state, location.country].filter(Boolean).join(", ");
};

const formatDimensions = (dimensions) => {
  if (!dimensions || typeof dimensions !== "object") return "Not specified";
  return [dimensions.lengthCm, dimensions.widthCm, dimensions.heightCm].every(Boolean)
    ? `${dimensions.lengthCm} x ${dimensions.widthCm} x ${dimensions.heightCm} cm`
    : "Not specified";
};

const PendingQuotations = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuotations = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "Quotations"));
        setQuotations(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch (error) {
        toast.error(error?.message || "Failed to load quotations.");
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Pending Quotations" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quotations</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Pending Quotation Requests</h1>
              <p className="mt-2 text-sm text-slate-400">
                Review all customer quotation submissions saved in the <span className="text-orange-400">Quotations</span> collection.
              </p>
            </header>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              {loading ? (
                <p className="text-sm text-slate-400">Loading quotations...</p>
              ) : quotations.length === 0 ? (
                <p className="text-sm text-slate-400">No quotation requests yet.</p>
              ) : (
                <div className="grid gap-4">
                  {quotations.map((quotation) => (
                    <article key={quotation.id} className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <ClipboardList size={18} className="text-orange-400" />
                            <h2 className="text-lg font-semibold text-white">{quotation.quotationNo || "Quotation"}</h2>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">
                            Customer: <span className="text-slate-200">{quotation.customerName || "Unknown"}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            Reference: <span className="text-slate-200">{quotation.referenceNo || "N/A"}</span>
                          </p>
                        </div>
                        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                          {quotation.status || "Pending"}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-sm font-semibold text-white">Origin</p>
                          <p className="mt-2 text-sm text-slate-300">{formatLocation(quotation.origin)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-sm font-semibold text-white">Destination</p>
                          <p className="mt-2 text-sm text-slate-300">{formatLocation(quotation.destination)}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-4">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-sm font-semibold text-white">Cargo</p>
                          <p className="mt-2 text-sm text-slate-300">{quotation.cargo || "Not specified"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-sm font-semibold text-white">Weight</p>
                          <p className="mt-2 text-sm text-slate-300">{quotation.weight || "Not specified"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-sm font-semibold text-white">Dimensions</p>
                          <p className="mt-2 text-sm text-slate-300">{formatDimensions(quotation.dimensions)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-sm font-semibold text-white">Quantity</p>
                          <p className="mt-2 text-sm text-slate-300">{quotation.itemQuantity || 1}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PendingQuotations;
