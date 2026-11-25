import { useEffect, useState } from 'react';
import Hl7Raw, { hl7Fields } from '../components/Hl7Raw.jsx';
import Icon from '../components/ui/Icon.jsx';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { qs } from '../lib/api.js';
import { dateTime } from '../lib/format.js';

const TYPES = [
  ['', 'All'],
  ['ADT^A04', 'ADT^A04'],
  ['SIU^S12', 'SIU^S12'],
  ['ORM^O01', 'ORM^O01'],
  ['ORU^R01', 'ORU^R01'],
  ['ACK', 'ACK'],
];

const MEANING = {
  'ADT^A04': 'Patient registered',
  'SIU^S12': 'Appointment booked',
  'ORM^O01': 'New diagnostic order',
  'ORU^R01': 'Results / report released',
  ACK: 'Acknowledgement from EMR',
};

export default function Hl7Page() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(`/hl7/messages${qs({ messageType: type, page, pageSize: 25 })}`);
  const [selected, setSelected] = useState(null);
  const scope = useEntrance([data?.items.length, type, page]);

  useEffect(() => {
    if (data?.items.length) setSelected((s) => data.items.find((m) => m.id === s?.id) ?? data.items[0]);
  }, [data]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div ref={scope}>
      <PageHead
        title="HL7 message log"
        subtitle="Every HL7 v2.5.1 message exchanged with the EMR, with its acknowledgement."
        actions={
          <div className="segmented">
            {TYPES.map(([v, l]) => (
              <button
                key={l}
                className={type === v ? 'on' : ''}
                onClick={() => {
                  setType(v);
                  setPage(1);
                }}
              >
                {l}
              </button>
            ))}
          </div>
        }
      />

      <LoadState loading={loading} error={error} onRetry={reload}>
        <div className="grid grid-main" style={{ alignItems: 'start' }}>
          <div className="card" data-animate>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Direction</th>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((m) => (
                    <tr
                      key={m.id}
                      className="clickable"
                      onClick={() => setSelected(m)}
                      style={selected?.id === m.id ? { boxShadow: 'inset 3px 0 0 var(--primary)' } : undefined}
                    >
                      <td>
                        <div className="cell-title mono">{m.messageType}</div>
                        <div className="cell-sub">{MEANING[m.messageType]}</div>
                      </td>
                      <td>
                        <StatusBadge value={m.direction} />
                      </td>
                      <td>{m.patient?.fullName ?? '—'}</td>
                      <td>
                        <StatusBadge value={m.status} />
                      </td>
                      <td className="small">{dateTime(m.sentAt ?? m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="spread card-pad" style={{ paddingTop: 12, paddingBottom: 12 }}>
              <span className="small muted">
                {data?.total} messages · page {page} of {pages}
              </span>
              <div className="row">
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          </div>

          {selected && (
            <div className="card" data-animate style={{ position: 'sticky', top: 80 }}>
              <div className="card-head">
                <div>
                  <h3 className="mono">{selected.messageType}</h3>
                  <div className="hint mono">control id {selected.controlId}</div>
                </div>
                {selected.ackCode && (
                  <span className="badge tone-lab">
                    <Icon name="check" size={12} /> MSA {selected.ackCode}
                  </span>
                )}
              </div>
              <div className="card-body stack" style={{ gap: 12 }}>
                <Hl7Raw text={selected.rawMessage} />
                <div className="stack" style={{ gap: 8 }}>
                  {hl7Fields(selected.rawMessage).map((seg, i) => (
                    <div key={i}>
                      <div className="small strong" style={{ color: 'var(--primary)' }}>
                        {seg.name}
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        {seg.fields.map((f) => (
                          <span key={f.id} className="badge" title={f.id}>
                            <span className="muted mono">{f.id}</span> {f.value.length > 36 ? `${f.value.slice(0, 36)}…` : f.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </LoadState>
    </div>
  );
}
