import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import RequireRole from './components/layout/RequireRole.jsx';
import { useAuth } from './lib/AuthContext.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import CdssPage from './pages/CdssPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import Hl7Page from './pages/Hl7Page.jsx';
import ImagingWorklistPage from './pages/ImagingWorklistPage.jsx';
import LabWorklistPage from './pages/LabWorklistPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MyRecordsPage from './pages/MyRecordsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import PatientDetailPage from './pages/PatientDetailPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import StudyPage from './pages/StudyPage.jsx';

const STAFF = ['ADMIN', 'DOCTOR', 'LAB_TECH', 'RADIOLOGIST', 'RECEPTIONIST'];

export default function App() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--primary)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const guard = (roles, element) => <RequireRole roles={roles}>{element}</RequireRole>;

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="me" element={guard(['PATIENT'], <MyRecordsPage />)} />
        <Route path="patients" element={guard(STAFF, <PatientsPage />)} />
        <Route path="patients/:id" element={guard(STAFF, <PatientDetailPage />)} />
        <Route path="appointments" element={guard(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'], <AppointmentsPage />)} />
        <Route path="orders" element={guard(['ADMIN', 'DOCTOR'], <OrdersPage />)} />
        <Route path="worklist/lab" element={guard(['ADMIN', 'LAB_TECH', 'DOCTOR'], <LabWorklistPage />)} />
        <Route path="worklist/imaging" element={guard(['ADMIN', 'RADIOLOGIST', 'DOCTOR'], <ImagingWorklistPage />)} />
        <Route path="imaging/:id" element={<StudyPage />} />
        <Route path="billing" element={guard(['ADMIN', 'RECEPTIONIST'], <BillingPage />)} />
        <Route path="cdss" element={guard(['ADMIN', 'DOCTOR', 'LAB_TECH', 'RADIOLOGIST'], <CdssPage />)} />
        <Route path="hl7" element={guard(['ADMIN', 'DOCTOR'], <Hl7Page />)} />
        <Route path="audit" element={guard(['ADMIN'], <AuditPage />)} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
