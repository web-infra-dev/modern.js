import {
  createElement,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';

export type RemoteInfo = {
  name: string;
  expose: string;
  manifest: string;
  entry: string;
  consumer: string;
  request: string;
};
const serverSettings = { enabled: false, paletteSeed: '' };
type InspectStore = {
  settings: typeof serverSettings;
  listeners: Set<() => void>;
};
const storeKey = Symbol.for('mf-lab.inspect');
function getStore(): InspectStore {
  const target = window as unknown as Record<symbol, InspectStore>;
  if (!target[storeKey]) {
    const store = {
      settings: serverSettings,
      listeners: new Set<() => void>(),
    };
    target[storeKey] = store;
    window.addEventListener('message', event => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== 'mf-lab-inspect' ||
        typeof event.data.enabled !== 'boolean' ||
        typeof event.data.paletteSeed !== 'string'
      )
        return;
      if (
        store.settings.enabled === event.data.enabled &&
        store.settings.paletteSeed === event.data.paletteSeed
      )
        return;
      store.settings = {
        enabled: event.data.enabled,
        paletteSeed: event.data.paletteSeed,
      };
      store.listeners.forEach(listener => listener());
    });
  }
  return target[storeKey];
}
function subscribe(listener: () => void) {
  const store = getStore();
  store.listeners.add(listener);
  window.parent.postMessage(
    { type: 'mf-lab-inspect-ready' },
    window.location.origin,
  );
  return () => {
    store.listeners.delete(listener);
  };
}
const snapshot = () => getStore().settings;
const serverSnapshot = () => serverSettings;
function remoteColor(name: string, seed: string) {
  let hash = 2166136261;
  for (const character of `${seed}:${name}`)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `hsl(${((hash >>> 0) % 36000) / 100} 75% 78%)`;
}
function visualRoots(node: Element): Element[] {
  return Array.from(node.children).flatMap(child => {
    if (['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE'].includes(child.tagName))
      return [];
    return getComputedStyle(child).display === 'contents'
      ? visualRoots(child)
      : [child];
  });
}
type Bounds = {
  top: number;
  left: number;
  width: number;
  height: number;
  chain: string;
};
type Source = Pick<RemoteInfo, 'name' | 'expose' | 'manifest'>;
function InspectLabel({
  sources,
  info,
  paletteSeed,
}: {
  sources: Source[];
  info: RemoteInfo;
  paletteSeed: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const label = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!expanded) return;
    function closeOutside(event: PointerEvent) {
      if (!label.current?.contains(event.target as Node)) setExpanded(false);
    }
    function closeEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setExpanded(false);
        label.current?.querySelector('button')?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [expanded]);
  return (
    <div ref={label} className="mf-inspect-label" data-expanded={expanded}>
      {(expanded ? sources : sources.slice(0, 1)).map((source, index) => (
        <div
          className="mf-inspect-row"
          key={`${index}:${source.name}${source.expose}`}
        >
          <span
            className="mf-inspect-dot"
            style={{ background: remoteColor(source.name, paletteSeed) }}
          />
          <a
            className="mf-inspect-source"
            href={source.manifest}
            target="_blank"
            rel="noreferrer"
            title={`${source.manifest}${index === sources.length - 1 ? `\nConsumer: ${info.consumer}\nRequest: ${info.request}\nEntry: ${info.entry}` : ''}`}
          >
            <strong>
              {source.name}
              <span>/{source.expose.replace(/^\.\//, '')}</span>
            </strong>
            <span className="mf-inspect-url">
              {source.manifest.replace(/^https?:\/\//, '')}
            </span>
          </a>
          {index === 0 && sources.length > 1 && (
            <button
              type="button"
              className="mf-inspect-toggle"
              aria-label={expanded ? '收起内部来源' : '展开内部来源'}
              aria-expanded={expanded}
              onClick={() => setExpanded(value => !value)}
            >
              <span>{sources.length - 1}</span>
              <span className="mf-inspect-chevron">⌄</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
function Boundary({
  info,
  children,
}: {
  info: RemoteInfo;
  children: React.ReactNode;
}) {
  const { enabled, paletteSeed } = useSyncExternalStore(
    subscribe,
    snapshot,
    serverSnapshot,
  );
  const boundary = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  useEffect(() => {
    if (!enabled || !boundary.current) {
      setBounds(null);
      return;
    }
    const node = boundary.current;
    let observed: Element[] = [];
    const observer = new ResizeObserver(measure);
    function measure() {
      const roots = visualRoots(node);
      if (
        roots.length !== observed.length ||
        roots.some((root, index) => root !== observed[index])
      ) {
        observer.disconnect();
        roots.forEach(root => observer.observe(root));
        observed = roots;
      }
      // A re-export and its producer can own the same visual element. Show one
      // outline with the whole chain instead of two overlapping labels.
      const sharedRoot = Array.from(
        node.querySelectorAll('[data-mf-boundary]'),
      ).some(child => {
        const nested = visualRoots(child);
        return (
          roots.length === nested.length &&
          roots.every((root, index) => root === nested[index])
        );
      });
      const rects = roots
        .map(root => root.getBoundingClientRect())
        .filter(rect => rect.width && rect.height);
      if (sharedRoot || !rects.length) {
        setBounds(null);
        return;
      }
      const chain: Source[] = [
        { name: info.name, expose: info.expose, manifest: info.manifest },
      ];
      let ancestor =
        node.parentElement?.closest<HTMLElement>('[data-mf-boundary]');
      while (ancestor) {
        const ancestorRoots = visualRoots(ancestor);
        if (
          roots.length !== ancestorRoots.length ||
          roots.some((root, index) => root !== ancestorRoots[index])
        )
          break;
        chain.unshift({
          name: ancestor.dataset.mfName!,
          expose: ancestor.dataset.mfExpose!,
          manifest: ancestor.dataset.mfManifest!,
        });
        ancestor =
          ancestor.parentElement?.closest<HTMLElement>('[data-mf-boundary]');
      }
      const left = Math.min(...rects.map(rect => rect.left));
      const top = Math.min(...rects.map(rect => rect.top));
      const next = {
        left,
        top,
        width: Math.max(...rects.map(rect => rect.right)) - left,
        height: Math.max(...rects.map(rect => rect.bottom)) - top,
        chain: JSON.stringify(chain),
      };
      setBounds(previous =>
        previous &&
        Object.keys(next).every(
          key => previous[key as keyof Bounds] === next[key as keyof Bounds],
        )
          ? previous
          : next,
      );
    }
    measure();
    const mutations = new MutationObserver(measure);
    mutations.observe(node, { childList: true, subtree: true });
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [enabled, info]);
  const sources: Source[] = bounds ? JSON.parse(bounds.chain) : [];
  return (
    <div
      ref={boundary}
      data-mf-boundary=""
      data-mf-name={info.name}
      data-mf-expose={info.expose}
      data-mf-manifest={info.manifest}
      style={{ display: 'contents' }}
    >
      {children}
      {enabled &&
        bounds &&
        createPortal(
          <div
            className="mf-inspect-outline"
            data-testid="mf-inspect-outline"
            data-mf-name={sources[0].name}
            data-mf-expose={sources[0].expose}
            style={
              {
                '--inspect-color': remoteColor(sources[0].name, paletteSeed),
                top: bounds.top,
                left: bounds.left,
                width: bounds.width,
                height: bounds.height,
              } as CSSProperties
            }
          >
            <InspectLabel
              sources={sources}
              info={info}
              paletteSeed={paletteSeed}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

export function inspectedComponent(
  Component: ComponentType<Record<string, unknown>>,
  info: RemoteInfo,
) {
  function Inspected(props: Record<string, unknown>) {
    return <Boundary info={info}>{createElement(Component, props)}</Boundary>;
  }
  Inspected.displayName = `Inspect(${info.name}${info.expose})`;
  return Inspected;
}
