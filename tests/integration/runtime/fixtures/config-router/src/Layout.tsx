import { Outlet, Link } from '@modern-js/runtime/router';

export default () => (
  <>
    <div>
      <Link id="btn-apple" to="apple">
        apple
      </Link>
      <br />
      <Link id="btn-banana" to="banana/123">
        banana
      </Link>
      <br />
      <Link id="btn-orange" to="orange">
        orange
      </Link>
    </div>
    <p id="layout">Layout</p>
    <Outlet />
  </>
);
