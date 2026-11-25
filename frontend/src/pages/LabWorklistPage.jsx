import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import EnterResultsModal from '../components/EnterResultsModal.jsx';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { age, relative } from '../lib/format.js';
import { useToast } from '../lib/ToastContext.jsx';

export default function LabWorklistPage() {
  const { is } = useAuth();
  const toast = useToast();
  const { refreshCounts } = useOutletContext();
  const [status, setStatus] = useState('OPEN');
  const { data, error, loading, reload } = useApi(`/orders/worklist?type=LAB&status=${status}`);
  const services = useApi('/services?type=LAB');
  const [entering, setEntering] = useState(null);
  const scope = useEntrance([data?.length, status]);
  const canWork = is('LAB_TECH');

  const start = async (item) => {
    try {
      await api.patch(`/orders/items/${item.id}/start`);
      toast.success('Sample received', `${item.service.name} is now in progress`);
      reload();
      refreshCounts();
    } catch (err) {
      toast.error('Could not start', err.message);
    }
  };

  const analytesFor = (item) => services.data?.find((s) => s.id === item.serviceId)?.analytes ?? [];

  return (
    <div ref={scope}>
      <PageHead
        title="Laboratory worklist"
        subtitle="STAT first, then oldest first. Entering results releases them and runs the CDSS rules."
        actions={
          <div className="segmented">
            {[
              ['OPEN', 'Open'],
              ['COMPLETED', 'Completed'],
            ].map(([v, l]) => (
              <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>
                {l}
              </button>
            ))}
          </div>
        }
      />

      <div className="card" data-animate>
        <LoadState loading={loading} error={error} onRetry={reload}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Patient</th>
                  <th>Ordered by</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.map((item) => (
                  <tr key={item.id} data-animate>
                    <td>
                      <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                        <span className="list-icon tone-lab">
                          <Icon name="flask" size={16} />
                        </span>
                        <div>
                          <div className="cell-title">{item.service.name}</div>
                          <div className="cell-sub">
                            Item #{item.id} · order #{item.orderId} · {relative(item.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/patients/${item.order.patient.id}`} className="cell-title">
                        {item.order.patient.fullName}
                      </Link>
                      <div className="cell-sub">
                        {age(item.order.patient.birthDate)} y · {item.order.patient.gender === 'FEMALE' ? 'F' : 'M'}
                      </div>
                    </td>
                    <td>{item.order.doctor.fullName}</td>
                    <td>
                      <StatusBadge value={item.order.priority} dot={false} />
                    </td>
                    <td>
                      <StatusBadge value={item.status} />
                      {item.cdssAlerts.length > 0 && (
                        <div className="small" style={{ color: 'var(--danger)', marginTop: 4 }}>
                          {item.cdssAlerts.length} alert(s)
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {canWork && item.status === 'ORDERED' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => start(item)}>
                          Receive sample
                        </button>
                      )}
                      {canWork && ['ORDERED', 'IN_PROGRESS'].includes(item.status) && (
                        <button className="btn btn-primary btn-sm" style={{ marginLeft: 6 }} onClick={() => setEntering(item)} disabled={!services.data}>
                          Enter results
                        </button>
                      )}
                      {item.status === 'COMPLETED' && <span className="small muted">{item.labResults.filter((r) => r.flag !== 'NORMAL').length} abnormal</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && !data.length && <div className="empty">The lab worklist is empty.</div>}
          </div>
        </LoadState>
      </div>

      {entering && (
        <EnterResultsModal
          item={entering}
          analytes={analytesFor(entering)}
          onClose={() => setEntering(null)}
          onSaved={() => {
            reload();
            refreshCounts();
          }}
        />
      )}
    </div>
  );
}
