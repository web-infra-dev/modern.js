import { useLoader } from '@modern-js/runtime';
import hello from 'bff-api-app/index';
import { configure } from 'bff-api-app/runtime';
import user from 'bff-api-app/user/index';
import { useEffect, useState } from 'react';

configure({
  interceptor(request) {
    return async (url, params) => {
      let path = url;
      if (!url.toString().includes('http')) {
        path = `http://127.0.0.1:3399${url}`;
      } else {
        path = path.toString().replace('8080', '3399');
      }
      const res = await request(path, params);
      return res.json();
    };
  },
});

const App = () => {
  const [state, setState] = useState('');
  const { data } = useLoader(async () => {
    const res = await hello();
    return res;
  });

  useEffect(() => {
    user().then(res => setState(message));
  }, []);

  const { message = 'bff-express' } = data || {};
  return (
    <>
      <div className="user">fetch：{state}</div>
      <div className="hello">node-fetch：{message}</div>
    </>
  );
};

export default App;
