import { Link } from '@modern-js/plugin-router-legacy';

import './App.css';

const App = () => (
  <div>
    <h1>Test For App</h1>
    <Link to={'/a'}>去 A</Link>&nbsp;&nbsp;
    <Link to={'/b'}>去 B</Link>
  </div>
);

export default App;
