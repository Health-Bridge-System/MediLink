import Icon from './Icon.jsx';

export default function Empty({ icon = 'clipboard', title, text, action }) {
  return (
    <div className="empty">
      <Icon name={icon} size={28} />
      <div className="strong" style={{ color: 'var(--ink)' }}>
        {title}
      </div>
      {text && <div className="small">{text}</div>}
      {action}
    </div>
  );
}
