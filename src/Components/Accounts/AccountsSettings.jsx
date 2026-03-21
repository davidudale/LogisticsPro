import React, { useEffect, useState } from "react";
import { Sliders } from "lucide-react";
import { doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { app } from "../Auth/firebase.js";
import { useAuth } from "../Auth/AuthContext.jsx";

const db = getFirestore(app);

const defaultForm = {
  invoicePrefix: "INV",
  paymentReminderEmail: "",
  settlementNotes: "",
  autoMarkPartial: true,
};

const AccountsSettings = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      invoicePrefix: user?.profile?.invoicePrefix || "INV",
      paymentReminderEmail: user?.profile?.paymentReminderEmail || user?.email || "",
      settlementNotes: user?.profile?.settlementNotes || "",
      autoMarkPartial: typeof user?.profile?.autoMarkPartial === "boolean" ? user.profile.autoMarkPartial : true,
    });
  }, [user?.email, user?.profile]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        invoicePrefix: form.invoicePrefix.trim().toUpperCase() || "INV",
        paymentReminderEmail: form.paymentReminderEmail.trim().toLowerCase(),
        settlementNotes: form.settlementNotes.trim(),
        autoMarkPartial: Boolean(form.autoMarkPartial),
        updatedAt: serverTimestamp(),
      });
      toast.success("Accounts preferences updated.");
    } catch (error) {
      toast.error(error?.message || "Failed to save accounts preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex items-center gap-2">
        <Sliders size={18} className="text-orange-400" />
        <h2 className="text-lg font-semibold text-white">Preferences</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Keep a few billing defaults on your accounts profile for invoice and settlement handling.
      </p>

      <form className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.95fr]" onSubmit={handleSave}>
        <div className="space-y-4">
          <label className="space-y-2 block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Invoice Prefix</span>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={(event) => setForm((prev) => ({ ...prev, invoicePrefix: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
              placeholder="INV"
              maxLength={8}
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reminder Email</span>
            <input
              type="email"
              value={form.paymentReminderEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, paymentReminderEmail: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
              placeholder="accounts@logisticspro.com"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Settlement Notes</span>
            <textarea
              value={form.settlementNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, settlementNotes: event.target.value }))}
              rows={6}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
              placeholder="Standard bank details, receipt expectations, escalation notes..."
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <p className="text-sm font-semibold text-white">Workflow toggle</p>
            <label className="mt-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.autoMarkPartial}
                onChange={(event) => setForm((prev) => ({ ...prev, autoMarkPartial: event.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-400">
                Treat any non-zero payment update as a partial settlement unless it fully covers the invoice.
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
            <p className="font-semibold text-white">Profile scope</p>
            <p className="mt-2">
              These preferences are stored on your user profile in Firestore and can be reused by future accounts workflows.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-400 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default AccountsSettings;
