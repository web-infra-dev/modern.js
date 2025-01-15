import context from 'bff-api-app/api/context/index';
import hello, { postHello } from 'bff-api-app/api/index';
import getUser from 'bff-api-app/api/user/[id]';
import { configure } from 'bff-api-app/runtime';
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
  }, []);
  return <div className="hello">{message}</div>;
};

export default App;
