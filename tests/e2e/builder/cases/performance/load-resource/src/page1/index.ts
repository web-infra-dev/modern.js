import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import('../test').then(res => {
  console.log('res', res);
});

ReactDOM.render(React.createElement(App), document.getElementById('root'));
