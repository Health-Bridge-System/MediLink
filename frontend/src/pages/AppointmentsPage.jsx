import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BookAppointmentModal from '../components/BookAppointmentModal.jsx';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { date, time } from '../lib/format.js';
import { useToast } from '../lib/ToastContext.jsx';

export default function AppointmentsPage() {
  const { is } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('upcoming');
  const path = `/appointments${qs({ upcoming: view === 'upcoming' ? 'true' : undefined, pageSize: 50 })}`;
  const { data, error, loading, reload } = useApi(path);
  const scope = useEntrance([data?.items.length, view]);
  const booking = params.get('new') === '1';
  const isPatient = is('PATIENT');

  const setStatus = async (appt, status) => {
    try {
      await api.patch(`/appointments/${appt.id}/status`, { status });
      toast.success(status === 'CANCELLED' ? 'Appointment cancelled' : 'Patient checked in');
      reload();
    } catch (err) {
      toast.error('Could not update', err.message);
    }
  };

  // Group by day for a calendar-like list.
  const days = new Map();
  for (const a of data?.items ?? []) {
    const key = new Date(a.dateTime).toDateString();
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(a);
  }

  return (
    <div ref={scope}>
      <PageHead
        title={isPatient ? 'My appointments' : 'Appointments'}
        subtitle="Visits booked for lab tests and scans"
        actions={
          <>
            <div className="segmented">
              <button className={view === 'upcoming' ? 'on' : ''} onClick={() => setView('upcoming')}>
                Upcoming
              </button>
              <button className={view === 'all' ? 'on' : ''} onClick={() => setView('all')}>
                All
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => setParams({ new: '1' })}>
              <Icon name="plus" size={16} />
              Book appointment
            </button>
          </>
        }
      />

      <LoadState loading={loading} error={error} onRetry={reload}>
        <div className="stack">
          {[...days.entries()].map(([day, list]) => (
            <div key={day} className="card" data-animate>
              <div className="card-head">
                <h3>{date(list[0].dateTime)}</h3>
                <span className="hint">{new Date(list[0].dateTime).toLocaleDateString('en-GB', { weekday: 'long' })}</span>
              </div>
              <div className="card-body">
                <div className="list">
                  {list.map((a) => (
                    <div key={a.id} className="list-item">
                      <div className="mono strong" style={{ width: 52 }}>
                        {time(a.dateTime)}
                      </div>
                      <span className={`list-icon ${a.service?.type === 'RADIOLOGY' ? 'tone-imaging' : 'tone-lab'}`}>
                        <Icon name={a.service?.type === 'RADIOLOGY' ? 'scan' : 'flask'} size={16} />
                      </span>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div className="strong small">
                          {isPatient ? a.service?.name : <Link to={`/patients/${a.patient.id}`}>{a.patient.fullName}</Link>}
                        </div>
                        <div className="small muted">
                          {isPatient ? a.staff?.fullName ?? 'Any doctor' : `${a.service?.name ?? '—'} · ${a.staff?.fullName ?? 'Any doctor'}`}
                          {a.notes && ` · ${a.notes}`}
                        </div>
                      </div>
                      {a.order && <span className="small muted">Order #{a.order.id}</span>}
                      <StatusBadge value={a.status} />
                      {a.status === 'SCHEDULED' && (
                        <div className="row" style={{ gap: 6 }}>
                          {is('RECEPTIONIST', 'ADMIN') && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setStatus(a, 'CHECKED_IN')}>
                              Check in
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => setStatus(a, 'CANCELLED')}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {data && !data.items.length && (
            <div className="card empty">
              <Icon name="calendar" size={28} />
              No {view === 'upcoming' ? 'upcoming ' : ''}appointments.
            </div>
          )}
        </div>
      </LoadState>

      {booking && (
        <BookAppointmentModal
          onClose={() => setParams({})}
          onBooked={() => {
            setParams({});
            setView('upcoming');
            reload();
          }}
        />
      )}
    </div>
  );
}
