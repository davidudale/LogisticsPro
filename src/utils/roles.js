export const ROLE = {
  CUSTOMER: "customer",
  OPSUSER: "opsuser",
  OPSMANAGER: "opsmanager",
  FLEETMANAGER: "fleetmanager",
  AUDITOR: "auditor",
  ACCOUNTS: "accounts",
  DRIVER: "driver",
  ADMIN: "admin",
};

const ROLE_ALIASES = {
  customer: ROLE.CUSTOMER,
  customers: ROLE.CUSTOMER,
  opsuser: ROLE.OPSUSER,
  staff: ROLE.OPSMANAGER,
  opsmanager: ROLE.OPSMANAGER,
  fleetmanager: ROLE.FLEETMANAGER,
  "fleet-manager": ROLE.FLEETMANAGER,
  fleet_manager: ROLE.FLEETMANAGER,
  auditor: ROLE.AUDITOR,
  audit: ROLE.AUDITOR,
  account: ROLE.ACCOUNTS,
  accounts: ROLE.ACCOUNTS,
  driver: ROLE.DRIVER,
  drivers: ROLE.DRIVER,
  admin: ROLE.ADMIN,
};

export const ROLE_OPTIONS = [
  { value: ROLE.ADMIN, label: "Admin", detail: "Full platform control" },
  { value: ROLE.OPSMANAGER, label: "Ops Manager", detail: "Operational oversight and dispatch" },
  { value: ROLE.FLEETMANAGER, label: "Fleet Manager", detail: "Fleet readiness, compliance, and reporting oversight" },
  { value: ROLE.AUDITOR, label: "Auditor", detail: "Audit trail, compliance review, and control monitoring" },
  { value: ROLE.ACCOUNTS, label: "Accounts", detail: "Invoicing and payment workflows" },
  { value: ROLE.DRIVER, label: "Driver", detail: "Driver dashboard and assignments" },
  { value: ROLE.CUSTOMER, label: "Customer", detail: "Customer self-service shipment and quotation access" },
  { value: ROLE.OPSUSER, label: "Ops User", detail: "Operational shipment workflow access" },
];

export const normalizeRole = (value) => {
  const role = (value || "").toString().trim().toLowerCase();
  return ROLE_ALIASES[role] || ROLE.OPSUSER;
};

export const getDashboardPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === ROLE.CUSTOMER) return "/customer";
  if (normalizedRole === ROLE.ADMIN) return "/admin";
  if (normalizedRole === ROLE.OPSMANAGER) return "/opsmanager";
  if (normalizedRole === ROLE.FLEETMANAGER) return "/fleet-manager";
  if (normalizedRole === ROLE.AUDITOR) return "/auditor";
  if (normalizedRole === ROLE.ACCOUNTS) return "/accounts";
  if (normalizedRole === ROLE.DRIVER) return "/driver";
  return "/opsuser";
};

export const getShipmentsPathByRole = (role, section = "") => {
  const normalizedRole = normalizeRole(role);
  const basePath = normalizedRole === ROLE.CUSTOMER
    ? "/customer/shipments"
    : "/opsuser/shipments";

  return section ? `${basePath}/${section}` : basePath;
};

export const isEmailVerificationRequired = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole !== ROLE.ADMIN
    && normalizedRole !== ROLE.OPSUSER
    && normalizedRole !== ROLE.OPSMANAGER
    && normalizedRole !== ROLE.FLEETMANAGER
    && normalizedRole !== ROLE.AUDITOR
    && normalizedRole !== ROLE.ACCOUNTS
    && normalizedRole !== ROLE.DRIVER;
};

export const canAccessRole = (userRole, allowedRoles = []) => {
  if (allowedRoles.length === 0) return true;

  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.some((role) => normalizeRole(role) === normalizedUserRole);
};

export const formatRoleLabel = (role) => {
  const match = ROLE_OPTIONS.find((item) => item.value === normalizeRole(role));
  return match?.label || "Ops User";
};
