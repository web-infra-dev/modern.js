import {
  createElement,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
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
type InspectStore = { enabled: boolean; listeners: Set<() => void> };
const storeKey = Symbol.for('mf-lab.inspect');
function getStore(): InspectStore {
  const target = window as unknown as Record<symbol, InspectStore>;
  if (!target[storeKey]) {
    const store = { enabled: false, listeners: new Set<() => void>() };
    target[storeKey] = store;
    window.addEventListener('message', event => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== 'mf-lab-inspect' ||
        typeof event.data.enabled !== 'boolean'
      )
        return;
      if (store.enabled === event.data.enabled) return;
      store.enabled = event.data.enabled;
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
const snapshot = () => getStore().enabled;
const serverSnapshot = () => false;
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
  chainDetails: string;
};
function Boundary({
  info,
  children,
}: {
  info: RemoteInfo;
  children: React.ReactNode;
}) {
  const enabled = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
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
      const chain: string[] = [info.name];
      const chainDetails = [`${info.name}${info.expose} @ ${info.manifest}`];
      let ancestor =
        node.parentElement?.closest<HTMLElement>('[data-mf-boundary]');
      while (ancestor) {
        chain.unshift(ancestor.dataset.mfName!);
        chainDetails.unshift(
          `${ancestor.dataset.mfName}${ancestor.dataset.mfExpose} @ ${ancestor.dataset.mfManifest}`,
        );
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
        chain: chain.join(' → '),
        chainDetails: chainDetails.join('\n'),
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
  const tone = info.name.includes('library')
    ? 'mint'
    : info.name.includes('nested')
      ? 'violet'
      : 'amber';
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
            className={`mf-inspect-outline ${tone}`}
            data-testid="mf-inspect-outline"
            data-mf-name={info.name}
            data-mf-expose={info.expose}
            style={{
              top: bounds.top,
              left: bounds.left,
              width: bounds.width,
              height: bounds.height,
            }}
          >
            <a
              className="mf-inspect-label"
              href={info.manifest}
              target="_blank"
              rel="noreferrer"
              aria-label={`${bounds.chain} ${info.expose} ${info.manifest}`}
              title={`Consumer: ${info.consumer}\nRequest: ${info.request}\nChain:\n${bounds.chainDetails}\nEntry: ${info.entry}`}
            >
              <strong>
                {bounds.chain}
                <span>{info.expose}</span>
              </strong>
              <span className="mf-inspect-url">
                {info.manifest.replace(/^https?:\/\//, '')}
              </span>
            </a>
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
