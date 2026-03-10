import { get as hello } from '@api/hello';
import { useEffect, useState } from 'react';

export default () => {
  const [text, setText] = useState('');

  useEffect(() => {
    hello().then(setText);
  }, []);
  return <div>{text}</div>;
};
