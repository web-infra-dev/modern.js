/* eslint-disable no-undef */
import React from 'react';
import { render } from 'react-dom';

function App() {
  return (
    <div>
      <div id="test">Hello Builder!</div>
    </div>
  );
}

render(React.createElement(App), document.getElementById('root'));
