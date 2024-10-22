import { BrowserRouter, Route, Routes } from '@modern-js/runtime/router';

export default (props: { basename: string }) => {
  const { basename } = props;

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route index element={<div>自控式路由子应用根路由</div>} />
        <Route path={'path'} element={<div>自控式路由子应用子路由</div>} />
      </Routes>
    </BrowserRouter>
  );
};
