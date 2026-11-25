import Empty from '../ui/Empty.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';

export default function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) {
    return (
      <div className="card">
        <Empty icon="shield" title="This page is not available for your role" text="Ask an administrator if you think you need access." />
      </div>
    );
  }
  return children;
}
