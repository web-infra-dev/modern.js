import { use } from 'next/dist/compiled/react';
import { hydrateRoot } from 'next/dist/compiled/react-dom/client';
import { createFromReadableStream } from 'next/dist/compiled/react-server-dom-webpack/client.browser';

function findReport(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (value.type === 'main' && value.props?.id === 'next-weather-fragment') return value;
  if (value.$$typeof === Symbol.for('react.lazy')) {
    return findReport(value._init(value._payload), seen);
  }
  const children = value.props ? [value.props.children] :
    value instanceof Map ? value.values() : Object.values(value);
  for (const child of children) {
    const report = findReport(child, seen);
    if (report) return report;
  }
}

const loadedScripts = new Map();

function loadScript(path) {
  if (!loadedScripts.has(path)) {
    loadedScripts.set(path, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = path;
      script.onload = resolve;
      script.onerror = () => {
        loadedScripts.delete(path);
        reject(Error(`Failed to load Next.js chunk: ${path}`));
      };
      document.head.append(script);
    }));
  }
  return loadedScripts.get(path);
}

export async function hydrateService(container, flight, _identifierPrefix, signal) {
  const { bytes, scripts } = JSON.parse(flight);
  // Register Next's App Router module IDs with the container's webpack runtime.
  await Promise.all(scripts.map(loadScript));
  signal.throwIfAborted();
  const buffer = Uint8Array.from(atob(bytes), char => char.charCodeAt(0));
  const data = createFromReadableStream(new Blob([buffer]).stream());
  function Fragment() {
    const result = use(data);
    const report = findReport(result.t);
    if (!report) throw Error('Next.js Flight response does not contain the weather service fragment');
    return report;
  }
  const root = hydrateRoot(container, <Fragment />, {
    onUncaughtError(error) { console.error(error); },
  });
  return () => root.unmount();
}
