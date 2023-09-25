import { Link } from '@modern-js/runtime/router';

const Index = (): JSX.Element => (
  <div>
    <h1>Hello, Modern.js!</h1>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Link to="user">User</Link>
      <a href="/devtools">DevTools</a>
      <a href="/admin">Admin</a>
    </div>
  </div>
);

export default Index;
