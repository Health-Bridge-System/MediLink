export default function Field({ label, error, hint, className = '', children }) {
  return (
    <div className={`field${error ? ' has-error' : ''} ${className}`}>
      {label && <label>{label}</label>}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="small muted">{hint}</span> : null}
    </div>
  );
}
