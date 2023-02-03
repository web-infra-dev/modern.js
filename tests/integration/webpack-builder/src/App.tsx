import './App.css';
import stylesForSass from './App.module.scss';
import stylesForLess from './App.module.less';
import img from './assets/icon.png';
import svgImg, { ReactComponent as Logo } from './assets/app.svg';
import './App.global.less';

console.log('svgImg', svgImg);

console.log('Logo', Logo);

const App = () => (
  <div className="container">
    <main>
      <img id="img" src={img} />
      <Logo id="test-svg" />
      <img id="test-img" src={svgImg} />
      <div id="test-css" />
      <div id="test-css-png" />
      <p className={stylesForSass.header}>header</p>
      <p className={stylesForLess.title}>title</p>
      <div className="logo">
        <img
          src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png"
          width="300"
          alt="Modern.js Logo"
        />
      </div>
      <p className="description">
        Get started by editing <code className="code">src/App.tsx</code>
      </p>
      <div className="grid">
        <a href="https://modernjs.dev/docs/start" className="card">
          <h2>Quick Start</h2>
        </a>
        <a href="https://modernjs.dev/docs/guides" className="card">
          <h2>Handbook</h2>
        </a>
        <a href="https://modernjs.dev/docs/apis" className="card">
          <h2>API Reference </h2>
        </a>
        <a
          href="https://modernjs.dev/coming-soon"
          target="_blank"
          rel="noopener noreferrer"
          className="card"
        >
          <h2>Community </h2>
        </a>
      </div>
    </main>
    <footer className="footer">
      <a href="https://modernjs.dev" target="_blank" rel="noopener noreferrer">
        Powered by Modern.js
      </a>
    </footer>
  </div>
);

export default App;
