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
      </div>
    </main>
    <div className="env-variables" data-testid="env-vars">
      <div className="modern-env" data-testid="modern-test-var">
        MODERN_TEST_VAR: {process.env.MODERN_TEST_VAR || 'undefined'}
      </div>
      <div className="node-env" data-testid="node-env">
        NODE_ENV: {process.env.NODE_ENV || 'undefined'}
      </div>
      <div className="modern-local-var" data-testid="modern-local-var">
        MODERN_LOCAL_VAR: {process.env.MODERN_LOCAL_VAR || 'undefined'}
      </div>
    </div>
    <footer className="footer">
      <a href="https://modernjs.dev" target="_blank" rel="noopener noreferrer">
        Powered by Modern.js
      </a>
    </footer>
  </div>
);

export default App;
