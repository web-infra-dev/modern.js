import { useState } from 'react';

const Page = () => {
  const [count] = useState(0);
  return <div id="item">count: {count}</div>;
};

export default Page;
