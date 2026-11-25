import { Link } from 'react-router-dom';
import Empty from '../components/ui/Empty.jsx';

export default function NotFoundPage() {
  return (
    <div className="card">
      <Empty
        icon="search"
        title="Page not found"
        text="The page you opened does not exist."
        action={
          <Link className="btn btn-primary btn-sm" to="/">
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
