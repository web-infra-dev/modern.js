// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */
import React from 'react';
import { render } from 'react-dom';
import App from './App';

window.aa = 2;

render(React.createElement(App), document.getElementById('root'));
