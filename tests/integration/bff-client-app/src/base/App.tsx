// import getself from '@api/index';
import get from '@byted/bff-api-app/index';

import { post } from '@byted/bff-api-app/index';
import { upload } from '@byted/bff-api-app/upload';
import { post as postUser } from '@byted/bff-api-app/user';
import { configure } from '@modern-js/runtime/bff';

import { useEffect, useState } from 'react';

const getMockImage = () => {
  const imageData =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
  const blob = new Blob(
    [Uint8Array.from(atob(imageData.split(',')[1]), c => c.charCodeAt(0))],
    { type: 'image/png' },
  );

  return new File([blob], 'mock_image.png', { type: 'image/png' });
};

// configure({
//   interceptor(request) {
//     return async (path, params) => {
//       // const url = `http://localhost:8080${path}`;
//       const url = (path as string).replace(/^\/api-app/, '/api-client');

//       const res = await request(url, params);
//       return res.json();
//     };
//   },
// });

const App = () => {
  const [message, setMessage] = useState('bff-express');
  useEffect(() => {
    const fetchData = async () => {
      const res = await get();
      console.log('res', res);

      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('res.message', res.message);
      setMessage(res.message);
    };

    fetchData();
    post();
    postUser();

    upload({
      files: {
        images: getMockImage(),
      },
    });
  }, []);
  return <div className="hello">{message}</div>;
};

export default App;
