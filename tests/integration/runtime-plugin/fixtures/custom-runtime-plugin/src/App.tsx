import { BrowserRouter, Route, Routes } from '@modern-js/runtime/router';
import { useContext } from 'react';
import { Context } from './plugins/context';

export default () => {
  const context = useContext(Context);
  return (
    <BrowserRouter>
      <Routes>
        <Route
          index
          element={<div className="description">{context.test}</div>}
        />
        <Route path="about" element={<div>about</div>} />
      </Routes>
    </BrowserRouter>
  );
};
