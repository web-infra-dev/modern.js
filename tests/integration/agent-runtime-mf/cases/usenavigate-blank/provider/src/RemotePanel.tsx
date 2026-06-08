import { useEffect, useState } from 'react';

type NavigationState = {
  path: string;
  basename: string;
  matched: boolean;
  view: 'FeatureList' | 'LineagePage' | 'BlankPage';
  lastNavigation: string;
};

const mountPath = '/content-understand-feature-lineage';
const defaultBadBasename = 'content-understand-feature-lineage';

type RemotePanelProps = {
  basename?: string;
};

const readBasename = (basename?: string) => basename || defaultBadBasename;

const reportNavigation = (state: NavigationState) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent('usenavigate-blank:navigation-result', {
      detail: state,
    }),
  );
};

const createInitialState = (basename?: string): NavigationState => ({
  path: `${mountPath}/features`,
  basename: readBasename(basename),
  matched: true,
  view: 'FeatureList',
  lastNavigation: 'initial',
});

const resolveNavigation = (
  to: string,
  basename: string,
  lastNavigation: string,
): NavigationState => {
  const path = basename.startsWith('/') ? `${basename}${to}` : to;
  const matched = path.startsWith(`${mountPath}/`);
  const view = matched
    ? to.includes('lineage')
      ? 'LineagePage'
      : 'FeatureList'
    : 'BlankPage';

  return {
    path,
    basename,
    matched,
    view,
    lastNavigation,
  };
};

export default function RemotePanel({ basename }: RemotePanelProps) {
  const [state, setState] = useState(() => createInitialState(basename));

  useEffect(() => {
    reportNavigation(state);
  }, [state]);

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const detail =
        (event as CustomEvent<{ to?: string; reset?: boolean }>).detail ?? {};
      if (detail.reset) {
        setState(createInitialState(basename));
        window.history.pushState(null, '', `${mountPath}/features`);
        return;
      }

      const next = resolveNavigation(
        detail.to || '/features',
        readBasename(basename),
        detail.to || '/features',
      );
      window.history.pushState(null, '', next.path);
      setState(next);
    };
    window.addEventListener('usenavigate-blank:navigate', onNavigate);
    return () => {
      window.removeEventListener('usenavigate-blank:navigate', onNavigate);
    };
  }, [basename]);

  const navigate = (to: string) => {
    window.dispatchEvent(
      new CustomEvent('usenavigate-blank:navigate', {
        detail: { to },
      }),
    );
  };

  if (!state.matched) {
    return (
      <section
        aria-label="blank remote route"
        data-testid="remote-panel"
        style={{ minHeight: 160 }}
      />
    );
  }

  return (
    <section data-testid="remote-panel">
      <strong>Provider: lineage feature page</strong>
      <p>
        {state.view} is mounted under {mountPath}.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => navigate('/features')}>
          Features
        </button>
        <button type="button" onClick={() => navigate('/lineage')}>
          Lineage
        </button>
      </div>
    </section>
  );
}
