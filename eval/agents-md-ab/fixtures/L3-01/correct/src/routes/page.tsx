import { useEffect, useState } from 'react';
import { get as getHello } from '@api/hello';
import './index.css';

const Index = () => {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    getHello().then(m => setMsg(m));
  }, []);
  return (
    <div className="container-box">
      <main>{msg}</main>
    </div>
  );
};

export default Index;
