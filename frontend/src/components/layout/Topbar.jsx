import Icon from '../ui/Icon.jsx';
import { ROLE_LABEL, initials } from '../../lib/format.js';

export default function Topbar({ user, theme, onToggleTheme, onLogout, onMenu }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon mobile-nav-btn" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <div className="topbar-title">
        <b>{today}</b>
        <span className="muted"> · MediLink Diagnostic Center</span>
      </div>
      <div className="topbar-spacer" />
      <button className="btn btn-ghost btn-icon" onClick={onToggleTheme} aria-label="Toggle dark mode" title="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
      <div className="user-chip">
        <span className="avatar">{initials(user.name)}</span>
        <div>
          <div className="name">{user.name}</div>
          <div className="role">{user.specialty ?? ROLE_LABEL[user.role]}</div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onLogout} aria-label="Sign out" title="Sign out" style={{ border: 0 }}>
          <Icon name="logout" size={16} />
        </button>
      </div>
    </header>
  );
}
