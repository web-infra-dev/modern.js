import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * @preserve AAAA
 */

/**
 * @license BBB
 */

/*! Legal Comment CCC */

// Foo Bar

/*
 Foo Bar
 */
function App() {
  return (
    <div>
      <div id="test">Hello Builder!</div>
    </div>
  );
}

const domNode = document.getElementById('root');
if (domNode) {
  const root = createRoot(domNode);
  root.render(React.createElement(App));
}
