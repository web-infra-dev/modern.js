import { Link, Outlet, useLocation } from '@modern-js/runtime/router';
import { scenarios, type ScenarioName } from '../components/Scenario';
import './lab.css';
export default function Layout() {
  const location = useLocation();
  const current = location.pathname.split('/')[1] || 'static';
  const scenario = scenarios[current as ScenarioName] || scenarios.static;
  return (
    <div className="lab">
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="Federation lab home">
          <span className="brand-mark" aria-hidden="true">
            ↗
          </span>
          <span>
            Federation<span className="brand-sub">a Modern.js field lab</span>
          </span>
        </Link>
        <p className="nav-label">EXPLORE THE CONNECTION</p>
        <nav aria-label="Experiments">
          {Object.entries(scenarios).map(([name, item]) => (
            <Link
              key={name}
              to={`/${name}`}
              className={current === name ? 'nav-link active' : 'nav-link'}
              aria-current={current === name ? 'page' : undefined}
            >
              <span>{item.kind}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          Live, independent builds
          <p>
            Modern × Rslib
            <br />
            SSR & data fetching
          </p>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <span>MODULE FEDERATION / PLAYGROUND</span>
          <span className="mode-tag">Existing plugin baseline</span>
        </header>
        <div className="workspace-body">
          <div className="intro">
            <p className="eyebrow">{scenario.kind}</p>
            <h1>{scenario.title}</h1>
            <p className="description">{scenario.description}</p>
          </div>
          <div
            className="connection"
            aria-label={`Connection: Host to ${scenario.path}`}
          >
            <div className="connection-node">
              <span className="node-icon">H</span>
              <span>
                <b>Host</b>
                <small>Modern.js</small>
              </span>
            </div>
            <div className="wire">
              <span />
            </div>
            <div className="connection-node remote-node">
              <span className="node-icon">↗</span>
              <span>
                <b>{scenario.path}</b>
                <small>Independent origin</small>
              </span>
            </div>
          </div>
          <section className="stage" aria-label="Live experiment">
            <div className="stage-heading">
              <span className="status-dot" />
              <span>LIVE EXPERIMENT</span>
              <span className="stage-hint">Try the controls below</span>
            </div>
            <Outlet />
          </section>
          <footer>
            <span>Separate builds. Connected experiences.</span>
            <span>MODERN.JS × MODULE FEDERATION</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
