import { Link } from '@modern-js/runtime/router-v5';
import './a.less';

export default function A() {
  return (
    <div className="a">
      <h1>Here is page A</h1>
      <Link to={'/'}>返回 Home</Link>
    </div>
  );
}
