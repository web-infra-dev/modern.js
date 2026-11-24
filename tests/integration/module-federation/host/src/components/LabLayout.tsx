import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/controls';
import { LabIcon } from './LabIcon';
import type { ReactNode } from 'react';
import { useLocation } from '@modern-js/runtime/router';
import '../weather-base.css';
import './LabLayout.css';

export type LabSection = 'render' | 'ssr' | 'service';
export type LabTab = { label: string; href: string; active: boolean };

export function LabSidebar({ section }: { section: LabSection }) {
  const isProd = process.env.NODE_ENV === 'production';
  const fullOrigin =
    process.env.MF_LAB_SSR_SCOPE === 'entries'
      ? (isProd
          ? process.env.MF_LAB_UPDATE_ORIGIN
          : process.env.MF_LAB_DEV_ORIGIN) ||
        process.env.MF_LAB_UPDATE_ORIGIN ||
        ''
      : '';
  return (
    <aside className="lab-sidebar">
      <nav aria-label="Lab navigation">
        {(
          [
            ['render', 'Rendering', '/'],
            [
              'ssr',
              'SSR updates',
              isProd ? '/?lab=ssr&tab=cache' : '/?lab=ssr&tab=hmr',
            ],
            [
              'service',
              'Service apps',
              isProd
                ? '/service/forecast/today?lab=service&tab=cache'
                : '/service/forecast/today?lab=service&tab=load',
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
  tabs,
  children,
  className = '',
}: {
  section: LabSection;
  title: string;
  description?: string;
  tabs?: LabTab[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`lab-layout ${className}`}>
      <LabSidebar section={section} />
      <main className="lab-main">
        <header className="lab-heading">
          <h1>{title}</h1>
        </header>
        {tabs ? (
          <Tabs
            className="ui-tabs-root"
            value={tabs.find(tab => tab.active)?.href || ''}
            onValueChange={href => {
              window.location.href = href;
            }}
          >
            <div className="ui-tabs">
              <TabsList className="ui-tabs-list" aria-label="Test scenarios">
                {tabs.map(tab => (
                  <TabsTrigger
                    className="ui-tabs-trigger"
                    key={tab.href}
                    value={tab.href}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent
              className="lab-content"
              value={tabs.find(tab => tab.active)?.href || ''}
            >
              {children}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="lab-content">{children}</div>
        )}
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
  devPath = '/?lab=ssr&tab=hmr',
  partial = false,
  showPartialSwitch = true,
}: {
  path?: string;
  devPath?: string;
  partial?: boolean;
  showPartialSwitch?: boolean;
}) {
  const isProd = process.env.NODE_ENV === 'production';
  const devOrigin = process.env.MF_LAB_DEV_ORIGIN;
  const devPartialOrigin = process.env.MF_LAB_DEV_PARTIAL_ORIGIN;
  const production = process.env.MF_LAB_UPDATE_ORIGIN;
  const staticOrigin = process.env.MF_LAB_PARTIAL_ORIGIN;
  const targetBuild = (partial && staticOrigin) || production;
  const targetDev = (partial && devPartialOrigin) || devOrigin;
  const targetPartial = isProd ? staticOrigin : devPartialOrigin;
  const targetFull = isProd ? production : devOrigin;
  const scopePath = isProd ? path : devPath;
  return (
    <div className="lab-environments">
      <span>
        {isProd ? 'Build + serve' : 'Dev'} ·{' '}
        {partial
          ? 'Static imports · Partial update'
          : 'Dynamic imports · Application update'}
      </span>
      {!isProd && targetBuild && (
        <a href={`${targetBuild}${path}`}>
          <LabIcon name="server" /> Build + serve
        </a>
      )}
      {isProd && targetDev && (
        <a href={`${targetDev}${devPath}`}>
          <LabIcon name="server" /> Dev
        </a>
      )}
      {showPartialSwitch && !partial && targetPartial && (
        <a href={`${targetPartial}${scopePath}`}>
          <LabIcon name="code" /> Partial update
        </a>
      )}
      {showPartialSwitch && partial && targetFull && (
        <a href={`${targetFull}${scopePath}`}>
          <LabIcon name="code" /> Application update
        </a>
      )}
    </div>
  );
}
