import { Fragment, useState } from 'react';
import PayModal from '../components/PayModal.jsx';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import Stat from '../components/ui/Stat.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { qs } from '../lib/api.js';
import { balanceOf, date, dateTime, money } from '../lib/format.js';

const FILTERS = [
  ['', 'All'],
  ['UNPAID', 'Unpaid'],
  ['PARTIAL', 'Partial'],
  ['PAID', 'Paid'],
];

export default function BillingPage() {
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(null);
  const [paying, setPaying] = useState(null);
  const { data, error, loading, reload } = useApi(`/invoices${qs({ paymentStatus: status, pageSize: 100 })}`);
  const scope = useEntrance([data?.items.length, status]);

  const items = data?.items ?? [];
  const outstanding = items.reduce((s, i) => s + balanceOf(i), 0);
  const collected = items.reduce((s, i) => s + i.payments.reduce((p, x) => p + Number(x.amount), 0), 0);

  return (
    <div ref={scope}>
      <PageHead
        title="Billing"
        subtitle="Itemized invoices are created automatically when every test in an order is complete."
        actions={
          <div className="segmented">
            {FILTERS.map(([v, l]) => (
              <button key={l} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>
                {l}
              </button>
            ))}
          </div>
        }
      />

      <LoadState loading={loading} error={error} onRetry={reload}>
        <div className="stack">
          <div className="grid grid-3">
            <Stat label="Invoices" value={data?.total} icon="receipt" tone="primary" foot={status ? `Filtered: ${status.toLowerCase()}` : 'All statuses'} />
            <Stat label="Collected" value={collected} format={money} icon="wallet" tone="lab" foot="Payments on these invoices" />
            <Stat label="Outstanding" value={outstanding} format={money} icon="alert" tone={outstanding ? 'warn' : 'lab'} foot="Remaining balance" />
          </div>

          <div className="card" data-animate>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Patient</th>
                    <th>Tests</th>
                    <th>Total</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((inv) => {
                    const balance = balanceOf(inv);
                    const expanded = open === inv.id;
                    return (
                      <Fragment key={inv.id}>
                        <tr className="clickable" data-animate onClick={() => setOpen(expanded ? null : inv.id)}>
                          <td>
                            <div className="cell-title mono">INV-{String(inv.id).padStart(5, '0')}</div>
                            <div className="cell-sub">
                              {date(inv.createdAt)} · order #{inv.orderId}
                            </div>
                          </td>
                          <td className="cell-title">{inv.patient.fullName}</td>
                          <td>{inv.items.length}</td>
                          <td className="strong">{money(inv.total)}</td>
                          <td>{money(balance)}</td>
                          <td>
                            <StatusBadge value={inv.paymentStatus} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {balance > 0 && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaying(inv);
                                }}
                              >
                                <Icon name="wallet" size={14} /> Pay
                              </button>
                            )}
                          </td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={7} style={{ background: 'var(--surface-2)' }}>
                              <div className="grid grid-2" style={{ gap: 20 }}>
                                <div>
                                  <div className="small strong muted" style={{ marginBottom: 6 }}>
                                    LINE ITEMS
                                  </div>
                                  {inv.items.map((li) => (
                                    <div key={li.id} className="spread small" style={{ padding: '4px 0' }}>
                                      <span>
                                        {li.orderItem.service.name}
                                        {li.icd10Code && <span className="badge tone-primary mono" style={{ marginLeft: 6 }}>{li.icd10Code}</span>}
                                      </span>
                                      <b>{money(li.price)}</b>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div className="small strong muted" style={{ marginBottom: 6 }}>
                                    PAYMENTS
                                  </div>
                                  {inv.payments.map((p) => (
                                    <div key={p.id} className="spread small" style={{ padding: '4px 0' }}>
                                      <span>
                                        {dateTime(p.paidAt)} · {p.method.toLowerCase()}
                                      </span>
                                      <b style={{ color: 'var(--lab)' }}>{money(p.amount)}</b>
                                    </div>
                                  ))}
                                  {!inv.payments.length && <div className="small muted">No payments yet.</div>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {data && !items.length && <div className="empty">No invoices.</div>}
            </div>
          </div>
        </div>
      </LoadState>

      {paying && (
        <PayModal
          invoice={paying}
          onClose={() => setPaying(null)}
          onPaid={() => {
            setPaying(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
