import { useState } from 'react';
import LoadState from '../components/ui/LoadState.jsx';
import PageHead from '../components/ui/PageHead.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useEntrance } from '../hooks/useMotion.js';
import { qs } from '../lib/api.js';
import { ROLE_LABEL, dateTime } from '../lib/format.js';

const ACTION_TONE = { LOGIN: 'info', VIEW: 'muted', CREATE: 'lab', UPDATE: 'warn', DELETE: 'danger' };

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(`/audit${qs({ page, pageSize: 30 })}`);
  const scope = useEntrance([data?.items.length, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div ref={scope}>
      <PageHead title="Audit log" subtitle="Who signed in, viewed or changed patient data, and when." />
      <div className="card" data-animate>
        <LoadState loading={loading} error={error} onRetry={reload}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((l) => (
                  <tr key={l.id}>
                    <td className="small">{dateTime(l.loggedAt)}</td>
                    <td>
                      <div className="cell-title">{l.user?.username ?? 'system'}</div>
                      <div className="cell-sub">{ROLE_LABEL[l.user?.role] ?? ''}</div>
                    </td>
                    <td>
                      <Badge tone={ACTION_TONE[l.action]} dot>
                        {l.action}
                      </Badge>
                    </td>
                    <td className="mono">{l.tableName}</td>
                    <td className="mono">{l.recordId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="spread card-pad">
            <span className="small muted">
              {data?.total} entries · page {page} of {pages}
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
        </LoadState>
      </div>
    </div>
  );
}
