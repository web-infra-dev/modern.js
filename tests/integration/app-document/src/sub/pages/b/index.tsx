import { Link } from '@modern-js/plugin-router-v5/runtime';

export default function B() {
  return (
    <div>
      <h1>Here is page B</h1>
      <Link to={'/'}>返回 Home</Link>
    </div>
  );
}
