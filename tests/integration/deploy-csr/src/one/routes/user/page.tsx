import { Link } from '@modern-js/runtime/router';

export default () => {
  return (
    <div>
      Hello User
      <Link to="/?name=modernjs" id="home-btn">
        To Home Page
      </Link>
    </div>
  );
};
