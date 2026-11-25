const ARROW = { HIGH: '↑', LOW: '↓', CRITICAL: '‼' };

export default function LabResultGrid({ results }) {
  return (
    <div className="result-grid">
      {results.map((r) => (
        <div key={r.id ?? r.testName} className={`result-cell ${r.flag}`} title={r.flag}>
          <div className="small muted">{r.testName}</div>
          <div className="v" style={{ color: r.flag === 'CRITICAL' ? 'var(--danger)' : r.flag === 'NORMAL' ? 'var(--ink)' : 'var(--warn)' }}>
            {r.value} {ARROW[r.flag] ?? ''}
            <span className="small muted" style={{ fontWeight: 500, marginLeft: 4 }}>
              {r.unit}
            </span>
          </div>
          <div className="small muted">ref {r.normalRange ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}
