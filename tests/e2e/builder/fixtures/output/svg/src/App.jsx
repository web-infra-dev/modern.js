// eslint-disable-next-line no-unused-vars
import React from 'react';
// eslint-disable-next-line no-unused-vars
import svgImg, { ReactComponent as Logo } from './app.svg';
import './App.css';

function App() {
  return (
    <div>
      <div id="test">Hello Builder!</div>
      <Logo id="test-svg" />
      <img id="test-img" src={svgImg} />
      <div id="test-css" />
    </div>
  );
}

export default App;
