import { useEffect, useState } from 'react';
import { NoSSR } from '@modern-js/runtime/ssr';
import hello from '@api/index';

const App = () => {
  const [message, setMessage] = useState('bff-express');
  useEffect(() => {
    const fetchData = async () => {
      const res = await hello();
      setMessage(res.message);
    };

    fetchData();
  });
  return (
    <NoSSR>
      <div className="hello">{message}</div>
    </NoSSR>
  );
};

export default App;
