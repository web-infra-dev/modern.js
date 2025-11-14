import { RuntimeContext } from '@modern-js/runtime';
import { BrowserRouter, Route, Routes } from '@modern-js/runtime/router';
import { useContext } from 'react';

const App = () => {
  const context = useContext(RuntimeContext);
  const { initialData } = context;
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<div>index</div>} />
        <Route
          path="about"
          element={<div>about {initialData?.data as string}</div>}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
