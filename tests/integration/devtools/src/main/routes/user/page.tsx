import { Link } from '@modern-js/runtime/router';

const Page: React.FC = () => (
  <div>
    <h3>Hello Bob!</h3>
    <Link to="./profile">Edit Profile</Link>
  </div>
);

export default Page;
