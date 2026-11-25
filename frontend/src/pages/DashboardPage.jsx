import { useAuth } from '../lib/AuthContext.jsx';
import PatientHome from './PatientHome.jsx';
import StaffDashboard from './StaffDashboard.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  return user.role === 'PATIENT' ? <PatientHome /> : <StaffDashboard />;
}
