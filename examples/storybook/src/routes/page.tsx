import get from '@api/lambda/index';
import { useEffect, useState } from 'react';

const Page = () => {
  const [data, setData] = useState<{ message: string } | null>(null);

  useEffect(() => {
    get().then(setData);
  }, []);

  return <div id="item">{data?.message || 'Loading...'}</div>;
};

export default Page;
