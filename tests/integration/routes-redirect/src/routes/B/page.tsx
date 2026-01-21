import { Link } from '@modern-js/runtime/router';

const B = () => {
  console.log('B');
  return (
    <>
      <h1>B</h1>
      <p>
        <Link to="/A">to A</Link>
      </p>
      <p>
        <Link to="/A?isProblem=true">to A with problem</Link>
      </p>
    </>
  );
};

export default B;
