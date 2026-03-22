import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Mail,
  Pencil,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { toast } from "react-toastify";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";
import { app, secondaryAuth } from "../Auth/firebase.js";
import {
  ROLE,
  ROLE_OPTIONS,
  formatRoleLabel,
  normalizeRole,
} from "../../utils/roles.js";

const db = getFirestore(app);
const USERS_COLLECTION = "users";

const accountStatusOptions = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "invited", label: "Invited" },
];

const emptyCreateForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: ROLE.FLEETMANAGER,
  accountStatus: "pending",
};

const emptyEditForm = {
  fullName: "",
  email: "",
  phone: "",
  role: ROLE.FLEETMANAGER,
  accountStatus: "active",
};

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatTimestamp = (value) => {
  const timestamp = getTimestampValue(value);
  if (!timestamp) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const normalizeStatus = (value) => {
  const status = (value || "").toString().trim().toLowerCase();
  if (["active", "pending", "invited"].includes(status)) return status;
  return "active";
};

const formatStatusLabel = (status) => {
  const match = accountStatusOptions.find((item) => item.value === normalizeStatus(status));
  return match?.label || "Active";
};

const getRoleBadgeClass = (role) => {
  switch (normalizeRole(role)) {
    case "admin":
      return "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200";
    case "opsmanager":
      return "border-orange-500/30 bg-orange-500/10 text-orange-200";
    case "fleetmanager":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
    case "auditor":
      return "border-violet-500/30 bg-violet-500/10 text-violet-200";
    case "accounts":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "driver":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    default:
      return "border-slate-700 bg-slate-800/80 text-slate-200";
  }
};

const getStatusBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "invited":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
    default:
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }
};

const mapUserRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    uid: item.id,
    email: data.email || "",
    fullName: data.fullName || data.name || "",
    name: data.name || data.fullName || "",
    phone: data.phone || "",
    role: normalizeRole(data.role),
    accountStatus: normalizeStatus(data.accountStatus || data.status),
    accountType: data.accountType || "internal",
    emailVerified: typeof data.emailVerified === "boolean" ? data.emailVerified : null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

const UsersManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busyUserId, setBusyUserId] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editingUserId, setEditingUserId] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        setUsers(snapshot.docs.map(mapUserRecord));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        toast.error(error?.message || "Failed to load users.");
      },
    );

    return () => unsubscribe();
  }, []);

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (left, right) =>
          getTimestampValue(right.updatedAt || right.createdAt)
          - getTimestampValue(left.updatedAt || left.createdAt),
      ),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();

    return sortedUsers.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      if (!matchesRole) return false;
      if (!value) return true;

      return [
        user.fullName,
        user.email,
        user.phone,
        user.role,
        user.accountStatus,
        user.accountType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);
    });
  }, [query, roleFilter, sortedUsers]);

  const totalUsers = users.length;
  const activeUsers = useMemo(
    () => users.filter((user) => normalizeStatus(user.accountStatus) === "active").length,
    [users],
  );
  const pendingUsers = useMemo(
    () =>
      users.filter((user) => ["pending", "invited"].includes(normalizeStatus(user.accountStatus))).length,
    [users],
  );
  const privilegedUsers = useMemo(
    () => users.filter((user) => ["admin", "opsmanager", "fleetmanager", "auditor", "accounts"].includes(user.role)).length,
    [users],
  );

  const openCreateModal = () => {
    setCreateForm(emptyCreateForm);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUserId(user.id);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: normalizeRole(user.role),
      accountStatus: normalizeStatus(user.accountStatus),
    });
    setIsEditModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm(emptyCreateForm);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUserId("");
    setEditForm(emptyEditForm);
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    const normalizedEmail = createForm.email.trim().toLowerCase();
    const trimmedName = createForm.fullName.trim();
    const trimmedPhone = createForm.phone.trim();

    if (!trimmedName || !normalizedEmail || !createForm.password) {
      toast.info("Complete the required user details before saving.");
      return;
    }

    if (createForm.password.length < 6) {
      toast.info("Password must be at least 6 characters.");
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      toast.info("Passwords do not match.");
      return;
    }

    const duplicateEmail = users.some(
      (user) => user.email.trim().toLowerCase() === normalizedEmail,
    );
    if (duplicateEmail) {
      toast.error("A user with that email already exists.");
      return;
    }

    setBusyUserId(`create:${normalizedEmail}`);

    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        normalizedEmail,
        createForm.password,
      );

      await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
        email: normalizedEmail,
        fullName: trimmedName,
        name: trimmedName,
        phone: trimmedPhone,
        role: normalizeRole(createForm.role),
        accountStatus: normalizeStatus(createForm.accountStatus),
        accountType: "internal",
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await sendEmailVerification(credential.user);
      } catch (verificationError) {
        console.warn("Failed to send verification email on admin user creation:", verificationError);
      }

      toast.success("User created successfully. Verification email has been sent.");
      closeCreateModal();
    } catch (error) {
      toast.error(error?.message || "Failed to create user.");
    } finally {
      if (secondaryAuth.currentUser) {
        try {
          await signOut(secondaryAuth);
        } catch (signOutError) {
          console.warn("Failed to clear secondary auth session:", signOutError);
        }
      }
      setBusyUserId("");
    }
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    if (!editingUserId) return;

    const trimmedName = editForm.fullName.trim();
    const normalizedEmail = editForm.email.trim().toLowerCase();
    const trimmedPhone = editForm.phone.trim();

    if (!trimmedName || !normalizedEmail) {
      toast.info("Name and email are required.");
      return;
    }

    const duplicateEmail = users.some(
      (user) =>
        user.id !== editingUserId
        && user.email.trim().toLowerCase() === normalizedEmail,
    );
    if (duplicateEmail) {
      toast.error("Another user already uses that email.");
      return;
    }

    setBusyUserId(editingUserId);

    try {
      await updateDoc(doc(db, USERS_COLLECTION, editingUserId), {
        email: normalizedEmail,
        fullName: trimmedName,
        name: trimmedName,
        phone: trimmedPhone,
        role: normalizeRole(editForm.role),
        accountStatus: normalizeStatus(editForm.accountStatus),
        updatedAt: serverTimestamp(),
      });
      toast.success("User profile updated.");
      closeEditModal();
    } catch (error) {
      toast.error(error?.message || "Failed to update user.");
    } finally {
      setBusyUserId("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Users Management" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">System Setup</p>
                    <h1 className="mt-2 text-3xl font-bold text-white">Users Management</h1>
                    <p className="mt-2 max-w-3xl text-sm text-slate-400">
                      Manage internal users and their Firebase-backed roles from one place.
                      New users are created in Firebase Authentication and mirrored into the
                      Firestore <span className="font-semibold text-slate-200">users</span> collection.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-400 hover:bg-orange-500/20"
                >
                  <UserPlus size={18} />
                  Add User
                </button>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Users", value: totalUsers, icon: Users, tone: "text-white" },
                { label: "Active Accounts", value: activeUsers, icon: CheckCircle2, tone: "text-emerald-300" },
                { label: "Pending Onboarding", value: pendingUsers, icon: Mail, tone: "text-amber-300" },
                { label: "Privileged Roles", value: privilegedUsers, icon: ShieldCheck, tone: "text-orange-300" },
              ].map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    <Icon size={18} className="text-orange-400" />
                  </div>
                  <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">User Directory</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Roles are read from Firestore, which is the same source used by your current auth flow.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-400">
                    <Search size={16} />
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search name, email, phone, role..."
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500 md:w-72"
                    />
                  </label>

                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    <option value="all">All roles</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800">
                <div className="max-h-[65vh] overflow-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-sm">
                    <thead className="bg-slate-950/90 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.16em]">User</th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.16em]">Role</th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.16em]">Status</th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.16em]">Account</th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.16em]">Verification</th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-[0.16em]">Updated</th>
                        <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.16em]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredUsers.length ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="align-top">
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-semibold text-white">
                                  {user.fullName || user.email || "Unnamed user"}
                                </p>
                                <p className="mt-1 text-slate-400">{user.email || "No email"}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {user.phone || "Phone not added"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(user.role)}`}>
                                {formatRoleLabel(user.role)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(user.accountStatus)}`}>
                                {formatStatusLabel(user.accountStatus)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-300">
                              {(user.accountType || "internal").replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                  user.emailVerified === true
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                    : user.emailVerified === false
                                      ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                                      : "border-slate-700 bg-slate-800/80 text-slate-300"
                                }`}
                              >
                                {user.emailVerified === true
                                  ? "Verified"
                                  : user.emailVerified === false
                                    ? "Pending"
                                    : "Unknown"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-400">
                              {formatTimestamp(user.updatedAt || user.createdAt)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => openEditModal(user)}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-orange-500 hover:text-orange-200"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                            No users matched your current search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">New Internal User</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Create user account</h2>
                <p className="mt-2 text-sm text-slate-400">
                  This creates a Firebase Authentication account and its matching Firestore
                  profile record.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleCreateUser}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Full Name
                  </span>
                  <input
                    type="text"
                    value={createForm.fullName}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Jane Doe"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Email
                  </span>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="user@logisticspro.com"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Phone
                  </span>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="+2348012345678"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Role
                  </span>
                  <select
                    value={createForm.role}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                     {ROLE_OPTIONS.map((role) => (
                       <option key={role.value} value={role.value}>
                         {role.label}
                       </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Account Status
                  </span>
                  <select
                    value={createForm.accountStatus}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, accountStatus: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    {accountStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                  <p className="font-semibold text-white">{formatRoleLabel(createForm.role)}</p>
                  <p className="mt-2">
                    {ROLE_OPTIONS.find((role) => role.value === createForm.role)?.detail}
                  </p>
                </div>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Password
                  </span>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="At least 6 characters"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Confirm Password
                  </span>
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                    placeholder="Repeat password"
                    required
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyUserId.startsWith("create:")}
                  className="rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-400 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busyUserId.startsWith("create:") ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Profile Maintenance</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Edit user details</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Update the Firestore user profile used by the app for role-based routing.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleUpdateUser}>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Full Name
                </span>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Email
                </span>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Phone
                </span>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Role
                  </span>
                  <select
                    value={editForm.role}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Account Status
                  </span>
                  <select
                    value={editForm.accountStatus}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, accountStatus: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
                  >
                    {accountStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                <p className="font-semibold text-white">Role usage</p>
                <p className="mt-2">
                  Changing a user role here updates the same Firestore profile that the current
                  protected-route logic reads during sign-in.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyUserId === editingUserId}
                  className="rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-400 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busyUserId === editingUserId ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UsersManagement;
