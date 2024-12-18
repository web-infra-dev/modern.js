import { configure } from '@modern-js/runtime/bff';
import context from 'bff-api-app/context/index';
import hello, { postHello, post } from 'bff-api-app/index';
import getUser from 'bff-api-app/user/[id]';
import { useEffect, useState } from 'react';

configure({
  interceptor(request) {
    return async (url, params) => {
      const path = `http://localhost:8080${url}`;
      const res = await request(path, params);
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
    postHello({
      params: {
        id: '123',
      },
      query: {
        user: 'test@mail.com',
      },
      data: {
        info: [
          {
            key: '123',
          },
        ],
      },
      headers: {
        'x-header': '3333',
      },
    });
    post();
  }, []);
  return <div className="hello">{message}</div>;
};

export default App;
