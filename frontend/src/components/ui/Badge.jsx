export default function Badge({ tone = 'muted', dot = false, children, title }) {
  return (
    <span className={`badge tone-${tone}${dot ? ' badge-dot' : ''}`} title={title}>
      {children}
    </span>
  );
}
