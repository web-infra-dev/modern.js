import innerHello from '@api/index';
import { configure as innerConfigure } from '@modern-js/runtime/bff';
import type { AxiosRequestHeaders as Headers, Method } from 'axios';
import axios from 'axios';
import context from 'bff-api-app/api/context/index';
import hello, { postHello, post } from 'bff-api-app/api/index';
import getUser from 'bff-api-app/api/user/[id]';
import { configure } from 'bff-api-app/runtime';
import { useEffect, useState } from 'react';

configure({
  setDomain() {
    return 'http://127.0.0.1:3399';
  },
});

innerConfigure({
  async request(...config: Parameters<typeof fetch>) {
    const [url, params] = config;
    params?.headers && ((params.headers as any)['x-header'] = 'innerConfigure');
    const res = await axios({
      url: url as string, // 这里因为 fetch 和 axios 类型有些不兼容，需要使用 as
      method: params?.method as Method,
      data: params?.body,
      headers: params?.headers as Headers,
    });
    return res.data;
  },
});

const App = () => {
  const [message, setMessage] = useState('bff-client');
  const [inner, serInner] = useState('');

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
    innerHello().then(res => serInner(res.message));
  }, []);
  return (
    <>
      <div className="hello">hello：{message}</div>
      <div className="inner-hello">inner-hello：{inner}</div>
    </>
  );
};

export default App;
