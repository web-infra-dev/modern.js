import './App.css';

const App = () => (
  <div className="container">
    <main>
      <div className="logo">
        <img
          src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png"
          width="300"
          alt="Modern.js Logo"
        />
      </div>
      <p className="description">
        Get started by editing <code className="code">src/home/App.tsx</code>
      </p>
      <div className="grid">
        <a href="https://modernjs.dev/docs/start" className="card">
          <h2>Quick Start Tencent</h2>
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
          className="card">
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
