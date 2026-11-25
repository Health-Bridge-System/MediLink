import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import Stat from '../components/ui/Stat.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { date, dateTime } from '../lib/format.js';

export default function PatientHome() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(`/patients/${user.patientId}/history`);
  const scope = useEntrance([Boolean(data)]);

  const next = data?.appointments
    .filter((a) => a.status === 'SCHEDULED' && new Date(a.dateTime) > new Date())
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];
  const latest = data?.orders[0];
  const ready = data?.orders.flatMap((o) => o.items.filter((i) => i.status === 'COMPLETED').map((i) => ({ ...i, order: o }))) ?? [];

  return (
    <div ref={scope}>
      <PageHead
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle="Your visits and results at MediLink."
        actions={
          <Link className="btn btn-primary" to="/appointments?new=1">
            <Icon name="calendar" size={16} />
            Book a visit
          </Link>
        }
      />
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="stack">
            <div className="grid grid-4">
              <Stat label="Next appointment" value={next ? 1 : 0} format={() => (next ? date(next.dateTime) : 'None')} icon="calendar" tone="primary" foot={next ? `${next.service?.name} · ${dateTime(next.dateTime).split(', ')[1]}` : 'Book one any time'} />
              <Stat label="Results ready" value={ready.length} icon="flask" tone="lab" foot="Lab tests and final reports" />
              <Stat label="Diagnoses" value={data.diagnoses.length} icon="file" tone="imaging" foot="On your medical record" />
              <Stat label="Prescriptions" value={data.prescriptions.length} icon="heart" tone="warn" foot="Issued by your doctors" />
            </div>

            {latest && (
              <div className="card card-pad" data-animate>
                <div className="spread">
                  <div>
                    <h3 style={{ fontSize: 15 }}>Your latest order · #{latest.id}</h3>
                    <div className="small muted">
                      {latest.items.map((i) => i.service.name).join(', ')} · ordered by {latest.doctor.fullName} on {date(latest.orderDate)}
                    </div>
                  </div>
                  <StatusBadge value={latest.status} />
                </div>
              </div>
            )}

            <div className="grid grid-2">
              <div className="card" data-animate>
                <div className="card-head">
                  <h3>Recent results</h3>
                  <Link className="btn btn-ghost btn-sm" to="/me">
                    Full record
                  </Link>
                </div>
                <div className="card-body">
                  <div className="list">
                    {ready.slice(0, 5).map((i) => {
                      const abnormal = i.labResults.filter((r) => r.flag !== 'NORMAL').length;
                      return (
                        <div key={i.id} className="list-item">
                          <span className={`list-icon ${i.service.type === 'LAB' ? 'tone-lab' : 'tone-imaging'}`}>
                            <Icon name={i.service.type === 'LAB' ? 'flask' : 'scan'} size={16} />
                          </span>
                          <div style={{ flex: 1 }}>
                            <div className="strong small">{i.service.name}</div>
                            <div className="small muted">
                              {date(i.completedAt)} ·{' '}
                              {i.service.type === 'LAB'
                                ? abnormal
                                  ? `${abnormal} value${abnormal > 1 ? 's' : ''} outside the normal range`
                                  : 'All values normal'
                                : i.imagingStudy?.report?.impression ?? 'Report pending'}
                            </div>
                          </div>
                          {i.service.type === 'LAB' && abnormal > 0 && <StatusBadge value="HIGH" />}
                        </div>
                      );
                    })}
                    {!ready.length && <div className="small muted">No results yet.</div>}
                  </div>
                </div>
              </div>

              <div className="card" data-animate>
                <div className="card-head">
                  <h3>Prescriptions</h3>
                </div>
                <div className="card-body">
                  <div className="list">
                    {data.prescriptions.map((p) => (
                      <div key={p.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                        <span className="list-icon tone-primary">
                          <Icon name="file" size={16} />
                        </span>
                        <div style={{ flex: 1 }}>
                          <div className="strong small">{p.items.map((i) => i.drugName).join(' + ')}</div>
                          <div className="small muted">
                            {p.items.map((i) => `${i.dose ?? ''} ${i.frequency ?? ''}`.trim()).join(' · ')}
                          </div>
                          <div className="small muted">
                            {p.doctor.fullName} · {date(p.issueDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {!data.prescriptions.length && <div className="small muted">No prescriptions.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </LoadState>
    </div>
  );
}
