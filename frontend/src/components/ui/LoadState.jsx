import Empty from './Empty.jsx';

// Shows skeleton rows while loading and a friendly message on error;
// renders children once data is ready.
export default function LoadState({ loading, error, onRetry, rows = 4, children }) {
  if (error) {
    return (
      <div className="card">
        <Empty
          icon="alert"
          title={error.status === 403 ? 'You do not have access to this' : 'Something went wrong'}
          text={error.message}
          action={
            onRetry && (
              <button className="btn btn-ghost btn-sm" onClick={onRetry}>
                Try again
              </button>
            )
          }
        />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="stack">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton" style={{ height: i === 0 ? 92 : 56 }} />
        ))}
      </div>
    );
  }
  return children;
}
