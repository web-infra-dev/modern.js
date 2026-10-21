// Runs before the application entry, including while hydration is delayed.
// Element Timing measures the two real data texts, not a React lifecycle.
export const weatherMetricsScript = String.raw`
(() => {
  const metrics = window.__weatherMetrics = {};
  const publish = (event, at, method) => {
    if (metrics[event] || !Number.isFinite(at)) return;
    metrics[event] = { at: Math.round(at), method };
    window.parent.postMessage({ type: 'mf-weather', event, ...metrics[event] }, location.origin);
  };
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'mf-weather-metrics-request') return;
    for (const [name, value] of Object.entries(metrics)) {
      parent.postMessage({ type: 'mf-weather', event: name, ...value }, location.origin);
    }
  });
  addEventListener('mf-weather-metric', event => {
    if (event.detail?.event === 'Client ready') publish('Client ready', event.detail.at, 'interactive commit');
  });
  const ids = ['weather-temperature', 'weather-condition'];
  if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes.includes('element')) {
    const painted = {};
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!ids.includes(entry.identifier)) continue;
        const at = entry.renderTime || entry.startTime;
        if (at > 0 && !painted[entry.identifier]) painted[entry.identifier] = at;
      }
      if (ids.every(id => painted[id])) {
        publish('Data visible', Math.max(...ids.map(id => painted[id])), 'element timing');
        observer.disconnect();
      }
    });
    observer.observe({ type: 'element', buffered: true });
  } else {
    // Other browsers: approximate visibility after intersection and a paint
    // opportunity. The UI tooltip identifies this fallback measurement.
    let intersection;
    const mutation = new MutationObserver(observe);
    function observe() {
      if (intersection || metrics['Data visible']) return;
      const nodes = ids.map(id => document.querySelector('[elementtiming="' + id + '"]'));
      if (!nodes.every(Boolean)) return;
      const visible = new Set();
      intersection = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        if (nodes.every(node => visible.has(node))) {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (nodes.every(node => node.isConnected)) publish('Data visible', performance.now(), 'visibility estimate');
          }));
          mutation.disconnect();
          intersection.disconnect();
        }
      });
      nodes.forEach(node => intersection.observe(node));
    }
    mutation.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    observe();
  }
  parent.postMessage({ type: 'mf-weather-metrics-ready' }, location.origin);
})();
`;
