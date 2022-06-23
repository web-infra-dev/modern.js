import { useEffect, useState } from 'react';
import { NoSSR } from '@modern-js/runtime/ssr';
import hello, { postHello } from '@api/index';

const App = () => {
  const [message, setMessage] = useState('bff-express');
  useEffect(() => {
    const fetchData = async () => {
      const res = await hello();
      // 加一个延时，帮助集测取第一次的 message 值
      await new Promise(resolve => setTimeout(resolve, 50));
      setMessage(res.message);
    };

    fetchData();
    postHello({
      params: {
        id: '1111',
      },
      query: {
        user: 'jupiter@email.com',
      },
      data: {
        message: '3333',
      },
      headers: {
        'x-header': '3333',
      },
    });
  });
  return (
    <NoSSR>
      <div className="hello">{message}</div>
    </NoSSR>
  );
};

export default App;
