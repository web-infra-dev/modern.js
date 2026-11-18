import type { ReactNode } from 'react';
import { useLocation } from '@modern-js/runtime/router';
import '../weather-base.css';
import './LabLayout.css';

export type LabSection = 'render' | 'ssr' | 'service';
export type LabTab = { label: string; href: string; active: boolean };

export function LabSidebar({ section }: { section: LabSection }) {
  const fullOrigin =
    process.env.MF_LAB_SSR_SCOPE === 'entries'
      ? process.env.MF_LAB_UPDATE_ORIGIN || ''
      : '';
  return (
    <aside className="lab-sidebar">
      <nav aria-label="实验导航">
        {(
          [
            ['render', '渲染对比', '/'],
            ['ssr', 'SSR 更新', '/?lab=ssr&tab=hmr'],
            [
              'service',
              'Service 应用',
              '/service/forecast/today?lab=service&tab=load',
            ],
          ] as const
        ).map(([id, label, href]) => (
          <a
            key={id}
            href={id === 'service' ? `${fullOrigin}${href}` : href}
            aria-current={section === id ? 'page' : undefined}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              {id === 'render' ? (
                <>
                  <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
                  <path d="M10 4v12" />
                </>
              ) : id === 'ssr' ? (
                <>
                  <path d="M16 8a6.2 6.2 0 1 0 .1 4M16 3v5h-5" />
                </>
              ) : (
                <>
                  <rect x="3" y="2.5" width="14" height="6" rx="1.5" />
                  <rect x="3" y="11.5" width="14" height="6" rx="1.5" />
                  <path d="M6 5.5h1M6 14.5h1" />
                </>
              )}
            </svg>
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export function LabLayout({
  section,
  title,
  description,
  tabs,
  children,
}: {
  section: LabSection;
  title: string;
  description: string;
  tabs?: LabTab[];
  children: ReactNode;
}) {
  return (
    <div className="lab-layout">
      <LabSidebar section={section} />
      <main className="lab-main">
        <header className="lab-heading">
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {tabs && (
          <nav className="lab-tabs" aria-label="专项测试">
            {tabs.map(tab => (
              <a
                key={tab.label}
                href={tab.href}
                aria-current={tab.active ? 'page' : undefined}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        )}
        <div className="lab-content">{children}</div>
      </main>
    </div>
  );
}

export function LegacyLabNav() {
  const { pathname } = useLocation();
  return (
    <LabSidebar
      section={
        pathname.startsWith('/service')
          ? 'service'
          : pathname.startsWith('/bridge-ssr')
            ? 'ssr'
            : 'render'
      }
    />
  );
}

/** Explicit links between real dev/production/static configurations. */
export function LabEnvironments({
  path = '/?lab=ssr&tab=cache',
  partial = false,
}: {
  path?: string;
  partial?: boolean;
}) {
  const production = process.env.MF_LAB_UPDATE_ORIGIN;
  const staticOrigin = process.env.MF_LAB_PARTIAL_ORIGIN;
  return (
    <div className="lab-environments">
      <span>
        {process.env.NODE_ENV === 'production' ? 'Build + serve' : 'Dev'} ·{' '}
        {partial ? '静态入口 · 局部更新' : '动态消费 · 应用更新'}
      </span>
      {production && (
        <a href={`${production}${path}`}>
          进入 Build + serve 测试 <span aria-hidden="true">↗</span>
        </a>
      )}
      {staticOrigin && !partial && (
        <a href={`${staticOrigin}/?lab=ssr&tab=cache`}>
          局部更新配置 <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );
}
