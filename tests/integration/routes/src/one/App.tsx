import { Routes, Route } from '@modern-js/runtime/runtime-router';

import './App.css';

const App = () => (
  <Routes>
    <Route
      path="/"
      element={
        <p className="description">
          Get started by editing <code className="code">src/App.tsx</code>
        </p>
      }
    />
    <Route path="/*" element={<div className="four">404</div>} />
  </Routes>
);

export default App;
