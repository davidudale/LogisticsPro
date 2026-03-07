import React, { useState } from "react";
import { ArrowLeft, Building2, Check, Circle, LoaderCircle, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

const accountTypes = [
  {
    id: "business",
    title: "Business Account",
    description: "Create a company customer profile with a primary contact.",
    icon: Building2,
  },
  {
    id: "individual",
    title: "Individual Account",
    description: "Register a personal customer account for a single user.",
    icon: UserRound,
  },
];

const CustomerOnboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState("");

  const handleSelect = (accountType) => {
    if (isLoading) return;
    setIsLoading(true);
    setSelectedAccountType(accountType);
    navigate(`/customers-onboard/register/${accountType}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          disabled={isLoading}
          className="mb-8 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowLeft size={16} />
          Back to Homepage
        </button>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-400">
              Customer Onboarding
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Create a New Account
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
              Choose the account type to continue to the correct registration form.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {accountTypes.map(({ id, title, description, icon: Icon }, index) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                disabled={isLoading}
                className={`group relative flex min-h-[20rem] flex-col items-center justify-center rounded-[1.5rem] border px-8 py-10 text-center transition focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-not-allowed ${
                  index === 0
                    ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
                    : "border-slate-700 bg-slate-950/40 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
                } ${isLoading && selectedAccountType !== id ? "opacity-55" : ""}`}
              >
                <span
                  className={`absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border ${
                    index === 0
                      ? "border-emerald-400 bg-emerald-700 text-white"
                      : "border-slate-600 text-slate-500 transition group-hover:border-slate-400 group-hover:text-slate-300"
                  }`}
                >
                  {isLoading && selectedAccountType === id ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : index === 0 ? (
                    <Check size={18} />
                  ) : (
                    <Circle size={18} />
                  )}
                </span>

                <span
                  className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 ${
                    index === 0 ? "border-white/85 text-white" : "border-slate-500 text-slate-200"
                  }`}
                >
                  {isLoading && selectedAccountType === id ? (
                    <LoaderCircle size={46} strokeWidth={2.2} className="animate-spin" />
                  ) : (
                    <Icon size={46} strokeWidth={2.2} />
                  )}
                </span>

                <span className="text-2xl font-semibold">
                  {isLoading && selectedAccountType === id ? "Opening..." : title}
                </span>
                <span className={`mt-3 max-w-xs text-sm ${index === 0 ? "text-emerald-50/90" : "text-slate-400"}`}>
                  {isLoading && selectedAccountType === id
                    ? "Preparing the registration form for this account type."
                    : description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOnboard;
