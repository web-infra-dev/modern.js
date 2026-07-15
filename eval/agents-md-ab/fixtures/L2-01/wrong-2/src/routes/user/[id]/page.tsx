import { useEffect, useState } from 'react';

const UserPage = () => {
  const [name, setName] = useState('');
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(d => setName(d.name));
  }, []);
  return <h1>{name}</h1>;
};

export default UserPage;
