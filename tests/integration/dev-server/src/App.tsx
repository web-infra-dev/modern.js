import { BrowserRouter, Link, Route, Routes, Outlet } from 'react-router-dom';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={
          <div>
            home
            <div>
              <Link to="/a">A</Link>
            </div>
            <div>
              <Link to="/b">B</Link>
            </div>
            <Outlet />
          </div>
        }
      />
      <Route path="/a" element={<div>A</div>} />
      <Route path="/b" element={<div>B</div>} />
    </Routes>
  </BrowserRouter>
);

export default App;
