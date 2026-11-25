import PatientRecord from '../components/PatientRecord.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

export default function MyRecordsPage() {
  const { user } = useAuth();
  return <PatientRecord patientId={user.patientId} />;
}
