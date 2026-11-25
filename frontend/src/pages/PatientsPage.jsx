import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Field from '../components/ui/Field.jsx';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import PatientFields, { EMPTY_PATIENT } from '../components/PatientFields.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { age, date, initials } from '../lib/format.js';
import { check, patientSchema } from '../lib/schemas.js';
import { useToast } from '../lib/ToastContext.jsx';

export default function PatientsPage() {
  const { is } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [values, setValues] = useState(EMPTY_PATIENT);
  const [errors, setErrors] = useState({});
  const { data, error, loading, reload } = useApi(`/patients${qs({ search: query, pageSize: 50 })}`);
  const scope = useEntrance([data?.items.length, query]);

  // Debounce typing so we don't query MySQL on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const create = async () => {
    const { data: body, errors: errs } = check(patientSchema, values);
    setErrors(errs);
    if (!body) return;
    try {
      const patient = await api.post('/patients', body);
      toast.success('Patient registered', `${patient.fullName} · HL7 ADT^A04 sent to the EMR`);
      setAdding(false);
      setValues(EMPTY_PATIENT);
      navigate(`/patients/${patient.id}`);
    } catch (err) {
      setErrors(err.fieldErrors);
      toast.error('Could not register the patient', err.message);
    }
  };

  return (
    <div ref={scope}>
      <PageHead
        title="Patients"
        subtitle={data ? `${data.total} patients registered` : 'Everyone registered at the center'}
        actions={
          is('RECEPTIONIST', 'ADMIN', 'DOCTOR') && (
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} />
              Register patient
            </button>
          )
        }
      />

      <div className="card" data-animate>
        <div className="card-pad" style={{ paddingBottom: 12 }}>
          <div style={{ position: 'relative', maxWidth: 380 }}>
            <Icon name="search" size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--muted)' }} />
            <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by name, national ID or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <LoadState loading={loading} error={error} onRetry={reload}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>National ID</th>
                  <th>Age / sex</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((p) => (
                  <tr key={p.id} className="clickable" data-animate onClick={() => navigate(`/patients/${p.id}`)}>
                    <td>
                      <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                        <span className="avatar">{initials(p.fullName)}</span>
                        <div>
                          <div className="cell-title">{p.fullName}</div>
                          <div className="cell-sub mono">ML-{String(p.id).padStart(5, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{p.nationalId}</td>
                    <td>
                      {age(p.birthDate)} · {p.gender === 'FEMALE' ? 'F' : 'M'}
                    </td>
                    <td>{p.phone ?? '—'}</td>
                    <td>{p._count.orders}</td>
                    <td>{date(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && !data.items.length && <div className="empty">No patients match “{query}”.</div>}
          </div>
        </LoadState>
      </div>

      {adding && (
        <Modal
          title="Register a patient"
          onClose={() => setAdding(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={create}>
                Register
              </button>
            </>
          }
        >
          <div className="form-grid">
            <PatientFields values={values} errors={errors} onChange={setValues} />
          </div>
          <Field>
            <span className="small muted" style={{ marginTop: 12 }}>
              Saving sends an HL7 <span className="mono">ADT^A04</span> (register patient) message to the EMR simulator.
            </span>
          </Field>
        </Modal>
      )}
    </div>
  );
}
