import { Link, useParams } from 'react-router-dom';
import PatientRecord from '../components/PatientRecord.jsx';
import Icon from '../components/ui/Icon.jsx';

export default function PatientDetailPage() {
  const { id } = useParams();
  return (
    <div className="stack">
      <Link to="/patients" className="small strong row" style={{ gap: 4 }}>
        <Icon name="chevronRight" size={14} style={{ transform: 'rotate(180deg)' }} /> All patients
      </Link>
      <PatientRecord key={id} patientId={Number(id)} />
    </div>
  );
}
