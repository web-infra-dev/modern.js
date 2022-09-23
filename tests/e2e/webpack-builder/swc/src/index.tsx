import { useState } from 'react';

const container = document.createElement('div');
document.body.appendChild(container);

import('react-dom').then(ReactDom => {
  const App = () => {
    const [count, _setCount] = useState(0);
    return <div>Hello App {count}</div>;
  };
  ReactDom.render(<App />, container);
});
