export const ROUTES = {
  login: "/login",
  register: "/register",
  admin: {
    dashboard: "/admin/dashboard",
    employees: "/admin/employees",
    attendance: "/admin/attendance",
    schedules: "/admin/schedules",
    requests: "/admin/requests",
    news: "/admin/news",
    networks: "/admin/networks",
    qr: "/admin/qr",
    reports: "/admin/reports",
    assistant: "/admin/assistant",
    subscription: "/admin/subscription",
    audit: "/admin/audit",
    settings: "/admin/settings",
  },
  provider: {
    dashboard: "/provider/dashboard",
    companies: "/provider/companies",
    payments: "/provider/payments",
  },
} as const;
