import { Link } from '@modern-js/runtime/router';

export default function Page() {
  return (
    <div>
      Login
      <Link className="to-home" to="/">
        Home
      </Link>
    </div>
  );
}
