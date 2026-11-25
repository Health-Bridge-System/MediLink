import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NewOrderModal from '../components/NewOrderModal.jsx';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { qs } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { dateTime } from '../lib/format.js';

const FILTERS = [
  ['', 'All'],
  ['ORDERED', 'Ordered'],
  ['IN_PROGRESS', 'In progress'],
  ['COMPLETED', 'Completed'],
];

export default function OrdersPage() {
  const { is } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const { data, error, loading, reload } = useApi(`/orders${qs({ status, pageSize: 50 })}`);
  const scope = useEntrance([data?.items.length, status]);

  return (
    <div ref={scope}>
      <PageHead
        title="Diagnostic orders"
        subtitle="Each order holds one or more tests; every test is routed to the lab or imaging worklist."
        actions={
          <>
            <div className="segmented">
              {FILTERS.map(([v, l]) => (
                <button key={l} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>
                  {l}
                </button>
              ))}
            </div>
            {is('DOCTOR') && (
              <button className="btn btn-primary" onClick={() => setParams({ new: '1' })}>
                <Icon name="plus" size={16} />
                New order
              </button>
            )}
          </>
        }
      />

      <div className="card" data-animate>
        <LoadState loading={loading} error={error} onRetry={reload}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Patient</th>
                  <th>Tests</th>
                  <th>Doctor</th>
                  <th>Priority</th>
                  <th>Status</th>
                  {is('ADMIN') && <th>Invoice</th>}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((o) => (
                  <tr key={o.id} className="clickable" data-animate onClick={() => navigate(`/patients/${o.patient.id}`)}>
                    <td>
                      <div className="cell-title">#{o.id}</div>
                      <div className="cell-sub">{dateTime(o.orderDate)}</div>
                    </td>
                    <td className="cell-title">{o.patient.fullName}</td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {o.items.map((i) => (
                          <span key={i.id} className={`badge ${i.service.type === 'LAB' ? 'tone-lab' : 'tone-imaging'}`} title={i.status}>
                            {i.service.name.replace(/ \(.*\)$/, '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{o.doctor.fullName}</td>
                    <td>
                      <StatusBadge value={o.priority} dot={false} />
                    </td>
                    <td>
                      <StatusBadge value={o.status} />
                    </td>
                    {is('ADMIN') && <td>{o.invoice ? <StatusBadge value={o.invoice.paymentStatus} /> : <span className="muted small">—</span>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LoadState>
      </div>

      {params.get('new') === '1' && (
        <NewOrderModal
          onClose={() => setParams({})}
          onCreated={() => {
            setParams({});
            reload();
          }}
        />
      )}
    </div>
  );
}
