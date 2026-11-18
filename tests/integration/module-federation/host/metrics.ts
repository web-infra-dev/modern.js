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
  // Bridge applications have application controls rather than the ordinary
  // component's temperature Element Timing targets. Report an explicit paint
  // estimate and wait for the actual enabled wind control.
  if (/^\/(bridge-ssr|service)\//.test(location.pathname)) {
    const late = new URLSearchParams(location.search).has('late');
    let paintQueued = false;
    let intersection;
    const inspect = () => {
      if (late) {
        const timing = document.querySelector('[data-testid="service-mount-timing"]');
        if (timing?.hasAttribute('data-visible-ms')) publish('Data visible', Number(timing.getAttribute('data-visible-ms')), 'visibility estimate');
        if (timing?.hasAttribute('data-ready-ms')) publish('Client ready', Number(timing.getAttribute('data-ready-ms')), 'controls enabled after click');
      } else {
        if (!paintQueued && document.querySelector('[data-testid="weather-detail"]')) {
          paintQueued = true;
          intersection = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            requestAnimationFrame(() => requestAnimationFrame(() => publish('Data visible', performance.now(), 'visibility estimate')));
            intersection.disconnect();
          });
          intersection.observe(document.querySelector('[data-testid="weather-detail"]'));
        }
        if (document.querySelector('input[aria-label="Adjust wind direction"]:not(:disabled)')) publish('Client ready', performance.now(), 'controls enabled');
      }
      if (metrics['Data visible'] && metrics['Client ready']) observer.disconnect();
    };
    const observer = new MutationObserver(inspect);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    inspect();
    parent.postMessage({ type: 'mf-weather-metrics-ready' }, location.origin);
    return;
  }
  // Compact screens contain current weather and hourly forecast only.
  // Suspense boundaries may hydrate independently: wait for every key control.
  const focus = new URLSearchParams(location.search).get('focus');
  const expected = focus === 'nested' ? ['current', 'wind'] : focus === 'current' || new URLSearchParams(location.search).get('static') === '1' ? ['current'] : new URLSearchParams(location.search).get('compact') === '1'
    ? ['current', 'hourly'] : ['current', 'hourly', 'wind'];
  const ready = window.__weatherComponentReady = {};
  addEventListener('mf-weather-component-ready', event => {
    const { component, at } = event.detail || {};
    if (!expected.includes(component) || !Number.isFinite(at) || ready[component] !== undefined) return;
    ready[component] = at;
    if (expected.every(id => ready[id] !== undefined))
      publish('Client ready', Math.max(...expected.map(id => ready[id])), 'component effects');
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
