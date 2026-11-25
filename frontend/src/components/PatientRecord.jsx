import { useState } from 'react';
import Icon from './ui/Icon.jsx';
import LoadState from './ui/LoadState.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import NewOrderModal from './NewOrderModal.jsx';
import OrderTimelineItem from './OrderTimelineItem.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { age, balanceOf, date, dateTime, initials, money } from '../lib/format.js';

const TABS = [
  ['timeline', 'Orders & results'],
  ['diagnoses', 'Diagnoses'],
  ['prescriptions', 'Prescriptions'],
  ['appointments', 'Appointments'],
];
const BILLING_TAB = ['billing', 'Invoices'];

export default function PatientRecord({ patientId }) {
  const { user, is } = useAuth();
  const { data, error, loading, reload } = useApi(`/patients/${patientId}/history`);
  const [tab, setTab] = useState('timeline');
  const [ordering, setOrdering] = useState(false);
  const scope = useEntrance([Boolean(data), tab]);
  const clinical = user.role !== 'PATIENT';

  return (
    <div ref={scope}>
      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="stack">
            <div className="card card-pad" data-animate>
              <div className="spread" style={{ alignItems: 'flex-start' }}>
                <div className="row" style={{ gap: 16 }}>
                  <span className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
                    {initials(data.patient.fullName)}
                  </span>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}>{data.patient.fullName}</h1>
                    <div className="row small muted" style={{ gap: 14, marginTop: 4 }}>
                      <span>
                        MRN <b className="mono">ML-{String(data.patient.id).padStart(5, '0')}</b>
                      </span>
                      <span>
                        NID <span className="mono">{data.patient.nationalId}</span>
                      </span>
                      <span>
                        {data.patient.gender === 'FEMALE' ? 'Female' : 'Male'} · {age(data.patient.birthDate)} y ({date(data.patient.birthDate)})
                      </span>
                      {data.patient.phone && <span>{data.patient.phone}</span>}
                    </div>
                  </div>
                </div>
                {is('DOCTOR') && (
                  <button className="btn btn-primary" onClick={() => setOrdering(true)}>
                    <Icon name="plus" size={16} />
                    New order
                  </button>
                )}
              </div>
              <div className="row" style={{ gap: 8, marginTop: 14 }}>
                {data.diagnoses.slice(0, 4).map((d) => (
                  <span key={d.id} className="badge tone-primary" title={d.description}>
                    <span className="mono">{d.icd10Code}</span> {d.description}
                  </span>
                ))}
              </div>
            </div>

            <div className="segmented" data-animate style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
              {(is('ADMIN') ? [...TABS, BILLING_TAB] : TABS).map(([key, label]) => (
                <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'timeline' && (
              <div className="timeline">
                {data.orders.map((o) => (
                  <OrderTimelineItem key={o.id} order={o} showClinical={clinical} />
                ))}
                {!data.orders.length && <div className="muted">No orders yet.</div>}
              </div>
            )}

            {tab === 'diagnoses' && (
              <div className="card table-wrap" data-animate>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ICD-10</th>
                      <th>Description</th>
                      <th>Doctor</th>
                      <th>Order</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.diagnoses.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <span className="badge tone-primary mono">{d.icd10Code}</span>
                        </td>
                        <td>{d.description}</td>
                        <td>{d.doctor.fullName}</td>
                        <td>{d.orderId ? `#${d.orderId}` : '—'}</td>
                        <td>{date(d.diagnosedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'prescriptions' && (
              <div className="grid grid-2">
                {data.prescriptions.map((p) => (
                  <div key={p.id} className="card card-pad" data-animate>
                    <div className="spread">
                      <b>Prescription #{p.id}</b>
                      <span className="small muted">{date(p.issueDate)}</span>
                    </div>
                    <div className="small muted">{p.doctor.fullName}</div>
                    <div className="list" style={{ marginTop: 8 }}>
                      {p.items.map((i) => (
                        <div key={i.id} className="list-item">
                          <span className="list-icon tone-primary">
                            <Icon name="heart" size={15} />
                          </span>
                          <div>
                            <div className="strong small">
                              {i.drugName} {i.dose}
                            </div>
                            <div className="small muted">
                              {i.frequency} {i.durationDays ? `· ${i.durationDays} days` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {p.notes && <div className="callout" style={{ marginTop: 8 }}>{p.notes}</div>}
                  </div>
                ))}
                {!data.prescriptions.length && <div className="muted">No prescriptions.</div>}
              </div>
            )}

            {tab === 'appointments' && (
              <div className="card table-wrap" data-animate>
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Service</th>
                      <th>With</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.appointments.map((a) => (
                      <tr key={a.id}>
                        <td>{dateTime(a.dateTime)}</td>
                        <td>{a.service?.name ?? '—'}</td>
                        <td>{a.staff?.fullName ?? '—'}</td>
                        <td>
                          <StatusBadge value={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'billing' && is('ADMIN') && (
              <div className="card table-wrap" data-animate>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Order</th>
                      <th>Total</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((i) => (
                      <tr key={i.id}>
                        <td className="mono">INV-{String(i.id).padStart(5, '0')}</td>
                        <td>#{i.orderId}</td>
                        <td>{money(i.total)}</td>
                        <td>{money(balanceOf(i))}</td>
                        <td>
                          <StatusBadge value={i.paymentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </LoadState>

      {ordering && (
        <NewOrderModal
          patient={data.patient}
          onClose={() => setOrdering(false)}
          onCreated={() => {
            setOrdering(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
