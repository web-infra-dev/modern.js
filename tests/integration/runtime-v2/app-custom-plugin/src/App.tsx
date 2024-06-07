import { BrowserRouter, Route, Routes } from '@modern-js/runtime-v2/router';
import { useContext } from 'react';
import { Context } from './plugins/context';

export default () => {
  const value = useContext(Context);
  console.log('value', value);
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<div>index</div>} />
        <Route path="about" element={<div>about</div>} />
      </Routes>
    </BrowserRouter>
  );
};
