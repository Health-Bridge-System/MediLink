// Which pages each role sees in the sidebar. Route guards use the same table.
export const NAV = [
  { section: 'Overview' },
  { to: '/', label: 'Dashboard', icon: 'dashboard', roles: ['ADMIN', 'DOCTOR', 'LAB_TECH', 'RADIOLOGIST', 'RECEPTIONIST'] },
  { to: '/', label: 'My health', icon: 'heart', roles: ['PATIENT'] },
  { section: 'Clinical' },
  { to: '/patients', label: 'Patients', icon: 'users', roles: ['ADMIN', 'DOCTOR', 'LAB_TECH', 'RADIOLOGIST', 'RECEPTIONIST'] },
  { to: '/me', label: 'My records', icon: 'file', roles: ['PATIENT'] },
  { to: '/appointments', label: 'Appointments', icon: 'calendar', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
  { to: '/orders', label: 'Orders', icon: 'clipboard', roles: ['ADMIN', 'DOCTOR'] },
  { to: '/worklist/lab', label: 'Lab worklist', icon: 'flask', roles: ['ADMIN', 'LAB_TECH', 'DOCTOR'], badge: 'lab' },
  { to: '/worklist/imaging', label: 'Imaging worklist', icon: 'scan', roles: ['ADMIN', 'RADIOLOGIST', 'DOCTOR'], badge: 'imaging' },
  { section: 'Operations' },
  { to: '/billing', label: 'Billing', icon: 'receipt', roles: ['ADMIN'] },
  { to: '/cdss', label: 'Decision support', icon: 'brain', roles: ['ADMIN', 'DOCTOR', 'LAB_TECH', 'RADIOLOGIST'] },
  { section: 'Integration' },
  { to: '/hl7', label: 'HL7 messages', icon: 'message', roles: ['ADMIN', 'DOCTOR'] },
  { to: '/audit', label: 'Audit log', icon: 'shield', roles: ['ADMIN'] },
];

export function navFor(role) {
  const items = NAV.filter((n) => n.section || n.roles.includes(role));
  // Drop section headers with nothing under them.
  return items.filter((n, i) => !n.section || (items[i + 1] && !items[i + 1].section));
}
