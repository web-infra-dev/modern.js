import { BrowserRouter, Route, Routes } from '@modern-js/runtime-v2/router';

export default () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<div>index</div>} />
        <Route path="about" element={<div>about</div>} />
      </Routes>
    </BrowserRouter>
  );
};
