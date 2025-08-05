import hello from 'bff-api-app/api/index';
import user from 'bff-api-app/api/user/index';
import { configure } from 'bff-api-app/runtime';
import { useEffect, useState } from 'react';
import { useLoader } from '../useLoader';

configure({
  setDomain() {
    return 'http://127.0.0.1:3399';
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
