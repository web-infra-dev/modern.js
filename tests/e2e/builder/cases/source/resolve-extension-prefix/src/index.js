import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './ex';

const domNode = document.getElementById('root');
if (domNode) {
  const root = createRoot(domNode);
  root.render(React.createElement(App));
}
