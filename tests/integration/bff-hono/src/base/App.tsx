import hello, { postHello, getHello } from '@api/index';
import { configure } from '@modern-js/runtime/bff';
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
  const [message, setMessage] = useState('bff-express');
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const res = await hello();
  //     // 加一个延时，帮助集测取第一次的 message 值
  //     await new Promise(resolve => setTimeout(resolve, 50));
  //     setMessage(res.message);
  //   };

  //   fetchData();
  postHello({
    params: {
      id: '1111',
    },
    query: {
      user: 'modern@email.com',
    },
    data: {
      message: '3333',
    },
    headers: {
      'x-header': '3333',
      'x-parse-through-body': '1',
    },
  });

  //   getHello({
  //     query: {
  //       user: 'modern@email.com',
  //     },
  //   });
  // }, []);

  useEffect(() => {
    const data = {
      username: 'user123',
      password: 'pass456',
    };

    const params = new URLSearchParams();
    params.append('username', data.username);
    params.append('password', data.password);

    fetch('/bff-hono', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-parse-through-body': '1',
      },
      body: params.toString(),
    })
      .then(response => response.json())
      .then(result => console.log('成功:', result))
      .catch(error => console.error('错误:', error));
  }, []);

  return <div className="hello">{message}</div>;
};

export default App;
