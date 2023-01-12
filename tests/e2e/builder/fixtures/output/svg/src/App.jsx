// eslint-disable-next-line no-unused-vars
import React from 'react';
// eslint-disable-next-line no-unused-vars
import svgImg, { ReactComponent as Logo } from './app.svg';

function App() {
  return (
    <div>
      <div id="test">Hello Builder!</div>
      <Logo id="test-svg" />
      <img id="test-img" src={svgImg} />
    </div>
  );
}

export default App;
