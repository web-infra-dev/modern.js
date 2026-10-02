import Logo from './logo.svg?react';
import './App.less';
import './App.scss';

const App = () => (
  <div className="main">
    <p className="less-box">less</p>
    <p className="scss-box">scss</p>
    <Logo className="logo" />
  </div>
);

export default App;
