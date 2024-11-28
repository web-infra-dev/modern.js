import { configure } from '@modern-js/runtime/bff';
import context from 'bff-api-app/context/index';
import hello from 'bff-api-app/index';
import getUser from 'bff-api-app/user/[id]';
import { useEffect, useState } from 'react';

configure({
  interceptor(request) {
    return async (url, params) => {
      const res = await request(url, params);
      return res.json();
    };
  },
});

const App = () => {
  const [message, setMessage] = useState('bff-client');
  useEffect(() => {
    const fetchData = async () => {
      const res = await hello();
      // 加一个延时，帮助集测取第一次的 message 值
      await new Promise(resolve => setTimeout(resolve, 50));
      setMessage(res.message);
    };

    fetchData();
    context();
    getUser('1234');
  }, []);
  return <div className="hello">{message}</div>;
};

export default App;
