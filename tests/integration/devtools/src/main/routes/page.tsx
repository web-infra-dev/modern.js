import { Helmet } from '@modern-js/runtime/head';
import './index.css';

const Index = (): JSX.Element => (
  <div className="container-box">
    <Helmet>
      <link
        rel="icon"
        type="image/x-icon"
        href="https://lf3-static.bytednsdoc.com/obj/eden-cn/upspbovhj/edenx-ico.ico"
      />
    </Helmet>
    <main>
      <div className="title">
        Welcome to
        <img
          className="logo"
          src="https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvshpqnulg/eden-x-logo.png"
          alt="EdenX Logo"
        />
        <p className="name">EdenX</p>
      </div>
      <p className="description">
        Get started by editing <code className="code">src/routes/page.tsx</code>
      </p>
      <div className="grid">
        <div className="card">
          <div className="card-icon">
            <div className="card-icon-text">🚀</div>
          </div>
          <h2>Rust Bundler</h2>
          <p>Easily switch to Rspack bundler with faster build speed.</p>
        </div>
        <div className="card">
          <div className="card-icon">
            <div className="card-icon-text">✨</div>
          </div>
          <h2>Integrated BFF</h2>
          <p>
            Develop BFF code in the same project, enjoy simple function calls.
          </p>
        </div>
        <div className="card">
          <div className="card-icon">
            <div className="card-icon-text">🍭</div>
          </div>
          <h2>Nested Routes</h2>
          <p>File-as-route, comes with lots performance optimizations.</p>
        </div>
        <div className="card">
          <div className="card-icon">
            <div className="card-icon-text">📦</div>
          </div>
          <h2>Multi-Rendering Mode</h2>
          <p>SSR, SSG, SPR, all out of the box for you.</p>
        </div>
        <div className="card">
          <div className="card-icon">
            <div className="card-icon-text">🎨</div>
          </div>
          <h2>CSS Solutions</h2>
          <p>CSS Modules, CSS-in-JS, TailwindCSS, take your pick.</p>
        </div>
        <div className="card">
          <div className="card-icon">
            <div className="card-icon-text">📖</div>
          </div>
          <h2>Easy to Configure</h2>
          <p>
            Launch with zero configuration, then everything is configurable.
          </p>
        </div>
      </div>
    </main>
  </div>
);

export default Index;
