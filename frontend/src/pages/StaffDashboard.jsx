import { Link } from 'react-router-dom';
import Donut from '../components/charts/Donut.jsx';
import HBars from '../components/charts/HBars.jsx';
import RevenueArea from '../components/charts/RevenueArea.jsx';
import StackedBars from '../components/charts/StackedBars.jsx';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import Stat from '../components/ui/Stat.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { money, relative } from '../lib/format.js';

const ACTIONS = {
  DOCTOR: { to: '/orders?new=1', label: 'New order', icon: 'plus' },
  LAB_TECH: { to: '/worklist/lab', label: 'Open lab worklist', icon: 'flask' },
  RADIOLOGIST: { to: '/worklist/imaging', label: 'Open imaging worklist', icon: 'scan' },
  RECEPTIONIST: { to: '/appointments?new=1', label: 'Book appointment', icon: 'calendar' },
  ADMIN: { to: '/audit', label: 'View audit log', icon: 'shield' },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi('/reports/dashboard?days=14');
  const clinical = user.role !== 'RECEPTIONIST';
  const alerts = useApi(clinical ? '/cdss/alerts?pageSize=5&severity=CRITICAL' : null);
  const scope = useEntrance([Boolean(data)]);
  const action = ACTIONS[user.role];
  const first = user.name.startsWith('Dr.') ? user.name : user.name.split(' ')[0];

  return (
    <div ref={scope}>
      <PageHead
        title={`${greeting()}, ${first}`}
        actions={
          action && (
            <Link className="btn btn-primary" to={action.to}>
              <Icon name={action.icon} size={16} />
              {action.label}
            </Link>
          )
        }
      />

      <LoadState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="stack">
            <div className="grid grid-4">
              <Stat label="Patients registered" value={data.kpis.patients} icon="users" tone="primary" foot={`${data.kpis.ordersToday} orders placed today`} />
              <Stat label="Open tests" value={data.kpis.openItems} icon="clipboard" tone="info" foot="Ordered or in progress" />
              <Stat label="Critical alerts" value={data.kpis.criticalAlerts} icon="alert" tone="danger" foot="Last 14 days" />
              {data.kpis.revenueMonth !== null ? (
                <Stat label="Collected this month" value={data.kpis.revenueMonth} format={money} icon="wallet" tone="lab" foot={`${money(data.kpis.outstanding)} outstanding`} />
              ) : (
                <Stat label="AI reviews pending" value={data.kpis.pendingAi} icon="brain" tone="imaging" foot="Imaging suggestions to accept or reject" />
              )}
            </div>


            <div className="grid grid-main">
              <div className="card" data-animate>
                <div className="card-head">
                  <div>
                    <h3>Tests per day</h3>
                    <div className="hint">Order items created, last 14 days</div>
                  </div>
                  <div className="legend">
                    <span>
                      <i style={{ background: 'var(--lab)' }} />
                      Lab
                    </span>
                    <span>
                      <i style={{ background: 'var(--imaging)' }} />
                      Imaging
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <StackedBars data={data.testsPerDay} />
                </div>
              </div>

              <div className="card" data-animate>
                <div className="card-head">
                  <div>
                    <h3>Lab result flags</h3>
                    <div className="hint">All recorded values</div>
                  </div>
                </div>
                <div className="card-body">
                  <Donut
                    center={{ value: Object.values(data.resultFlags).reduce((a, b) => a + b, 0), label: 'values' }}
                    segments={[
                      { label: 'Normal', value: data.resultFlags.NORMAL ?? 0, color: 'var(--lab)' },
                      { label: 'High', value: data.resultFlags.HIGH ?? 0, color: 'var(--warn)' },
                      { label: 'Low', value: data.resultFlags.LOW ?? 0, color: 'var(--info)' },
                      { label: 'Critical', value: data.resultFlags.CRITICAL ?? 0, color: 'var(--danger)' },
                    ]}
                  />
                  <div className="divider" />
                  <div className="spread small">
                    <span className="muted">AI suggestions waiting for review</span>
                    <Link to="/cdss" className="strong">
                      {data.kpis.pendingAi} pending →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className={`grid ${data.revenueByMonth ? 'grid-3' : 'grid-2'}`}>
              {data.revenueByMonth && <div className="card" data-animate>
                <div className="card-head">
                  <div>
                    <h3>Revenue</h3>
                    <div className="hint">Payments collected per month</div>
                  </div>
                </div>
                <div className="card-body">
                  <RevenueArea data={data.revenueByMonth} />
                </div>
              </div>}

              <div className="card" data-animate>
                <div className="card-head">
                  <div>
                    <h3>Staff workload</h3>
                    <div className="hint">Completed tests, last 14 days</div>
                  </div>
                </div>
                <div className="card-body">
                  <HBars
                    rows={data.workload.slice(0, 5).map((w) => ({
                      label: w.name,
                      sub: w.role === 'LAB_TECH' ? 'Lab' : 'Imaging',
                      value: w.count,
                      color: w.role === 'LAB_TECH' ? 'var(--lab)' : 'var(--imaging)',
                    }))}
                  />
                </div>
              </div>

              <div className="card" data-animate>
                <div className="card-head">
                  <div>
                    <h3>Top diagnoses</h3>
                    <div className="hint">ICD-10 codes on record</div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="list">
                    {data.topDiagnoses.map((d) => (
                      <div key={d.code} className="list-item">
                        <span className="badge tone-primary mono">{d.code}</span>
                        <span className="small" style={{ flex: 1 }}>
                          {d.description}
                        </span>
                        <b className="small">{d.count}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {clinical && <div className="card" data-animate>
              <div className="card-head">
                <div>
                  <h3>Latest critical values</h3>
                  <div className="hint">Generated by the rule-based CDSS when a result crosses a panic limit</div>
                </div>
                <Link to="/cdss" className="btn btn-ghost btn-sm">
                  All alerts
                </Link>
              </div>
              <div className="card-body">
                {alerts.data?.items?.length ? (
                  <div className="list">
                    {alerts.data.items.map((a) => (
                      <div key={a.id} className="list-item">
                        <span className="list-icon tone-danger">
                          <Icon name="alert" size={16} />
                        </span>
                        <div style={{ flex: 1 }}>
                          <div className="strong small">{a.message}</div>
                          <div className="small muted">
                            <Link to={`/patients/${a.item.order.patient.id}`}>{a.item.order.patient.fullName}</Link> · {a.item.service.name} · {relative(a.createdAt)}
                          </div>
                        </div>
                        <StatusBadge value={a.severity} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="small muted">No critical values.</div>
                )}
              </div>
            </div>}
          </div>
        )}
      </LoadState>
    </div>
  );
}
