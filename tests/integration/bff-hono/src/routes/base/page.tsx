import hello, { post, postHello, getHello, getImage } from '@api/lambda/index';
import { useEffect, useState } from 'react';

const Page = () => {
  const [message, setMessage] = useState('bff-hono');
  const [username, setUsername] = useState('username');
  const [imageUrl, setImageUrl] = useState('');

  const fetchImage = async () => {
    const response = await getImage();
    const blob = await (response as any).blob();
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await hello();
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
        ext: [{ from: '123' }],
        arr: ['1', '2'],
        obj: {
          a: '1',
        },
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
    fetchImage();
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
      <img
        src={imageUrl}
        alt=""
        className="captcha-img"
        onError={e => {
          console.error('error', e);
        }}
      />
    </div>
  );
};

export default Page;
