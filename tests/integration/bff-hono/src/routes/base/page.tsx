import hello, { post, postHello, getHello } from '@api/index';
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

const Page = () => {
  const [message, setMessage] = useState('bff-hono');
  const [username, setUsername] = useState('username');

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
        user: 'modern@email.com',
      },
      data: {
        message: '3333',
      },
      headers: {
        'x-header': '3333',
      },
    });

    getHello({
      query: {
        user: 'modern@email.com',
      },
    });
  }, []);

  useEffect(() => {
    const data = {
      username: 'user123',
      password: 'pass456',
    };

    const params = new URLSearchParams();
    params.append('username', data.username);
    params.append('password', data.password);

    post({
      formUrlencoded: params.toString(),
    }).then(res => setUsername(res.formUrlencoded.username));
  }, []);

  return (
    <div>
      <div className="hello">{message}</div>
      <div className="username">{username}</div>
    </div>
  );
};

export default Page;
