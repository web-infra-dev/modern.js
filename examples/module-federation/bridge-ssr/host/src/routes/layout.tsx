import { NavLink, Outlet } from '@modern-js/runtime/router';
import { useState } from 'react';
import './workspace.css';

export default function WorkspaceLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={collapsed ? 'workspace compact' : 'workspace'}>
      <aside className="workspace-sidebar">
        <a className="workspace-brand" href="/">
          <span className="brand-symbol">杉</span>
          <span>
            杉禾商家中心<small>SHANHE COMMERCE</small>
          </span>
        </a>
        <div className="shop-selector">
          <span className="shop-icon">禾</span>
          <span>
            杉禾生活旗舰店<small>品牌直营 · 运营工作台</small>
          </span>
        </div>
        <div className="nav-caption">经营管理</div>
        <nav>
          <NavLink to="/" end>
            <span className="nav-icon">◫</span>工作台
          </NavLink>
          <NavLink to="/products">
            <span className="nav-icon">▦</span>商品管理
            <span className="nav-pill">18</span>
          </NavLink>
          <NavLink to="/inventory">
            <span className="nav-icon">▤</span>库存管理
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          营业中<small>数据随业务操作实时更新</small>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar-left">
            <button
              className="sidebar-toggle"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="切换侧栏"
            >
              ☰
            </button>
            <span>杉禾生活 / 经营管理</span>
          </div>
          <div className="workspace-account">
            <span className="store-badge">品牌直营</span>
            <span className="account-avatar">林</span>
            <span>
              林晓<small>店铺管理员</small>
            </span>
          </div>
        </header>
        <main className="workspace-content">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          杉禾商家中心 · 让好商品与好生意相遇
        </footer>
      </div>
    </div>
  );
}
