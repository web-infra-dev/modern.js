import hello from '@api/index';
import { configure } from '@modern-js/runtime/bff';
import { useEffect, useState } from 'react';

configure({
  interceptor(request) {
    return async (url, params) => {
      const res = await request(url, params);
      const data = await res.json();
      data.message = 'Hello Custom SDK';
      return data;
    };
  },
});

const Page = () => {
  const [data, setData] = useState<{ message: string }>();
  useEffect(() => {
    hello().then(res => {
      setData(res);
    });
  }, []);
  const { message = 'bff-hono' } = data || {};
  return <div className="hello">{message}</div>;
};

export default Page;
