import { useEffect, useState } from 'react';
import './index.css';

const Index = () => {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    fetch('/api/hello')
      .then(r => r.json())
      .then(m => setMsg(String(m)));
  }, []);
  return (
    <div className="container-box">
      <main>{msg}</main>
    </div>
  );
};

export default Index;
