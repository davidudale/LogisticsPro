import React, { useState } from "react";
import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { app } from "../Auth/firebase";
import { useAuth } from "../Auth/AuthContext.jsx";

const db = getFirestore(app);

const initialForm = {
  companyName: "",
  contactName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  notes: "",
};

const CustomerOnboard = () => {
  const navigate = useNavigate();
  const { signup, logout } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      if (form.password.length < 6) {
        const message = "Password must be at least 6 characters.";
        setError(message);
        toast.info(message);
        return;
      }
      if (form.password !== form.confirmPassword) {
        const message = "Passwords do not match.";
        setError(message);
        toast.info(message);
        return;
      }

      const credential = await signup(
        normalizedEmail,
        form.password,
        "opsuser",
        {
          fullName: form.contactName.trim(),
          name: form.contactName.trim(),
        },
      );

      await setDoc(doc(db, "customers", credential.user.uid), {
        uid: credential.user.uid,
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        email: normalizedEmail,
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        status: "active",
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess("Customer onboarded successfully.");
      setForm(initialForm);
      await logout();
      toast.success("Customer onboarded. Verification email has been sent.");
      navigate("/login", { replace: true });
    } catch (submitError) {
      if (submitError?.code === "auth/email-already-in-use") {
        toast.info("Account already exists. Please login.");
        navigate("/login", { replace: true });
        return;
      }
      const message = submitError?.message || "Failed to onboard customer.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Customer Onboarding</h1>
          <p className="text-slate-400 mt-2">
            Create a customer account and customer record in <span className="text-orange-400">customers</span>. A verification email is sent automatically.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">Company Name</span>
              <input
                name="companyName"
                value={form.companyName}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Acme Logistics"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">Contact Name</span>
              <input
                name="contactName"
                value={form.contactName}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Jane Doe"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="contact@acme.com"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">Phone</span>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="+1 555 0100"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Minimum 6 characters"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">Confirm Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Re-enter password"
              />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">Address</span>
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="123 Operations Blvd, Dallas, TX"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="Any special handling requirements..."
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold uppercase tracking-[0.12em] disabled:opacity-70"
          >
            {loading ? "Saving..." : "Onboard Customer"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerOnboard;
