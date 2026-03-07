import React, { useState } from "react";
import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { ArrowLeft, Building2, UserRound } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { app } from "../Auth/firebase";
import { useAuth } from "../Auth/AuthContext.jsx";

const db = getFirestore(app);

const initialForm = {
  companyName: "",
  contactName: "",
  contactRole: "",
  businessEmail: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  companyRegistrationNumber: "",
  taxId: "",
  industry: "",
  companySize: "",
  website: "",
  notes: "",
};

const accountTypeMeta = {
  business: {
    title: "Business Account Registration",
    description: "Create a company customer account and assign a primary contact.",
    icon: Building2,
    submitLabel: "Create Business Account",
  },
  individual: {
    title: "Individual Account Registration",
    description: "Register a personal customer account for one customer profile.",
    icon: UserRound,
    submitLabel: "Create Individual Account",
  },
};

const normalizeWebsite = (value) => {
  const website = value.trim();
  if (!website) return "";
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
};

const normalizePhone = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
};

const isValidPhone = (value) => /^\+?[1-9]\d{7,14}$/.test(value);

const CustomerRegistration = () => {
  const navigate = useNavigate();
  const { accountType } = useParams();
  const { signup, logout } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const config = accountTypeMeta[accountType];
  const isBusinessAccount = accountType === "business";

  if (!config) {
    return <Navigate to="/customers-onboard" replace />;
  }

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
      const loginEmail = (isBusinessAccount ? form.businessEmail : form.email).trim().toLowerCase();
      const trimmedCompanyName = form.companyName.trim();
      const trimmedContactName = form.contactName.trim();
      const trimmedContactRole = form.contactRole.trim();
      const trimmedPhone = normalizePhone(form.phone);
      const trimmedAddress = form.address.trim();
      const trimmedNotes = form.notes.trim();
      const trimmedIndustry = form.industry.trim();
      const trimmedCompanyRegistrationNumber = form.companyRegistrationNumber.trim();
      const trimmedTaxId = form.taxId.trim();
      const trimmedCompanySize = form.companySize.trim();
      const normalizedWebsite = normalizeWebsite(form.website);
      const customerName = isBusinessAccount
        ? trimmedCompanyName
        : trimmedContactName;
      const primaryEmail = isBusinessAccount ? loginEmail : form.email.trim().toLowerCase();

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

      if (!isValidPhone(trimmedPhone)) {
        const message = "Enter a valid phone number in international format.";
        setError(message);
        toast.info(message);
        return;
      }

      const credential = await signup(
        loginEmail,
        form.password,
        "opsuser",
        {
          fullName: trimmedContactName,
          name: trimmedContactName,
          accountType,
          companyName: isBusinessAccount ? trimmedCompanyName : "",
          contactRole: isBusinessAccount ? trimmedContactRole : "",
          phone: trimmedPhone,
        },
      );

      const customerPayload = {
        uid: credential.user.uid,
        accountType,
        companyName: customerName,
        contactName: trimmedContactName,
        contactRole: trimmedContactRole,
        email: primaryEmail,
        businessEmail: isBusinessAccount ? loginEmail : "",
        phone: trimmedPhone,
        address: trimmedAddress,
        companyRegistrationNumber: isBusinessAccount ? trimmedCompanyRegistrationNumber : "",
        taxId: isBusinessAccount ? trimmedTaxId : "",
        industry: isBusinessAccount ? trimmedIndustry : "",
        companySize: isBusinessAccount ? trimmedCompanySize : "",
        website: isBusinessAccount ? normalizedWebsite : "",
        notes: trimmedNotes,
        status: "active",
        emailVerified: false,
        phoneVerified: false,
        verification: {
          email: {
            status: "sent",
            required: true,
            sentAt: serverTimestamp(),
          },
          phone: {
            status: "pending",
            required: true,
            method: "manual-review",
          },
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (isBusinessAccount) {
        customerPayload.businessProfile = {
          legalName: trimmedCompanyName,
          registrationNumber: trimmedCompanyRegistrationNumber,
          taxId: trimmedTaxId,
          industry: trimmedIndustry,
          companySize: trimmedCompanySize,
          website: normalizedWebsite,
          primaryContact: {
            name: trimmedContactName,
            role: trimmedContactRole,
            email: loginEmail,
            phone: trimmedPhone,
          },
        };
      }

      await setDoc(doc(db, "customers", credential.user.uid), {
        ...customerPayload,
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

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/customers-onboard")}
          className="mb-8 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Change Account Type
        </button>

        <header className="mb-8 flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-600/15 text-orange-400">
            <Icon size={28} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {config.title}
            </h1>
            <p className="mt-2 text-slate-400">
              {config.description}
            </p>
            <p className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
              Email verification is sent automatically after registration. Phone verification is recorded as pending until it is confirmed by operations.
            </p>
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7"
        >
          {isBusinessAccount ? (
            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Business Profile</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Capture the company identity and the primary business contact.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Company Name
                  </span>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Acme Logistics Ltd"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Industry
                  </span>
                  <input
                    name="industry"
                    value={form.industry}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Freight and Logistics"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Registration Number
                  </span>
                  <input
                    name="companyRegistrationNumber"
                    value={form.companyRegistrationNumber}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="RC-123456"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Tax ID
                  </span>
                  <input
                    name="taxId"
                    value={form.taxId}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="TIN-908765"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Company Size
                  </span>
                  <select
                    name="companySize"
                    value={form.companySize}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Website
                  </span>
                  <input
                    name="website"
                    value={form.website}
                    onChange={onChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="https://acmelogistics.com"
                  />
                </label>
              </div>
            </section>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isBusinessAccount ? (
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Contact Person
                </span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="Jane Doe"
                />
              </label>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/30 px-4 py-3">
                <p className="text-sm font-medium text-slate-200">Individual account selected</p>
                <p className="mt-1 text-sm text-slate-400">
                  The customer&apos;s full name will be used as the primary account name.
                </p>
              </div>
            )}

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {isBusinessAccount ? "Contact Role" : "Full Name"}
              </span>
              <input
                name={isBusinessAccount ? "contactRole" : "contactName"}
                value={isBusinessAccount ? form.contactRole : form.contactName}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder={isBusinessAccount ? "Operations Manager" : "John Doe"}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {isBusinessAccount ? "Business Email" : "Email"}
              </span>
              <input
                type="email"
                name={isBusinessAccount ? "businessEmail" : "email"}
                value={isBusinessAccount ? form.businessEmail : form.email}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder={isBusinessAccount ? "procurement@acme.com" : "johndoe@example.com"}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Phone</span>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="+15550100"
              />
            </label>
          </div>

          {isBusinessAccount ? (
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Company Address
              </span>
              <input
                name="address"
                value={form.address}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="12 Industrial Estate Road, Lagos"
              />
            </label>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Password</span>
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
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Confirm Password
              </span>
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

          {!isBusinessAccount ? (
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Address</span>
              <input
                name="address"
                value={form.address}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="123 Operations Blvd, Dallas, TX"
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {isBusinessAccount ? "Operational Notes" : "Notes"}
            </span>
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
            className="w-full rounded-lg bg-orange-600 px-8 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white hover:bg-orange-700 disabled:opacity-70 sm:w-auto"
          >
            {loading ? "Saving..." : config.submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerRegistration;
