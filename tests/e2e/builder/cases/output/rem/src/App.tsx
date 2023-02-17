import React from 'react';
import './App.css';
import stylesForSass from './App.module.scss';
import stylesForLess from './App.module.less';

const App = () => (
  <div className="container">
    <p className={stylesForSass.header} id="header">
      header
    </p>
    <p className={stylesForLess.title} id="title">
      title
    </p>
    <p className="description" id="description">
      description
    </p>
  </div>
);

export default App;
