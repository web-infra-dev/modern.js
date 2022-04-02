import React from 'react';
import blueStyles from './blue.module.sass';
import greenStyles from './green.module.less';

const App = () => (
  <ul>
    <li className={greenStyles.greenText}>This is green text.</li>
    <li className={blueStyles.blueText}>This is blue text</li>
  </ul>
);

export default App;
