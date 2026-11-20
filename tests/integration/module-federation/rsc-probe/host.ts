import { createInstance } from '@module-federation/enhanced/runtime';
import { fetchBridgeService } from '@probe/service-fetch';
import { observeBenchReport } from '../host/src/components/observe-bench-report';

const nextService = document.body.dataset.nextRscService;
const runtime = createInstance({
  name: 'rsc_probe_host',
  remotes: nextService ? [{
    name: 'weather_next_rsc',
    entry: new URL(nextService, location.href).href,
    type: 'global',
  }] : ['v1', 'v2'].map(version => ({
    name: `rsc_probe_${version}`,
    entry: `${location.origin}/${version}/mf-manifest.json`,
  })),
  shared: {},
});
type Adapter = {
  hydrateService(
    container: HTMLElement,
    flight: string,
    identifierPrefix: string,
    signal: AbortSignal,
  ): (() => void) | Promise<() => void>;
};
const stylesheetLoads = new Map<string, Promise<void>>();

function loadStylesheet(href: string) {
  const existing = stylesheetLoads.get(href);
  if (existing) return existing;
  const pending = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => {
      link.remove();
      stylesheetLoads.delete(href);
      reject(new Error(`Stylesheet failed: ${href}`));
    };
    document.head.append(link);
  });
  stylesheetLoads.set(href, pending);
  return pending;
}

function mountService(
  container: HTMLElement,
  version: string,
  instanceId: string,
  onError: (error: unknown) => void,
) {
  const aborter = new AbortController();
  const { signal } = aborter;
  const identifierPrefix = instanceId + '-';
  let unmount: (() => void) | undefined;

  const render = fetchBridgeService(
    { instanceId, identifierPrefix, url: location.href, props: {}, signal },
    { url: new URL(`/service/${version}`, location.href).href },
  );
  const adapter = runtime.loadRemote<Adapter>(version === 'next' ? 'weather_next_rsc/client' : `rsc_probe_${version}/client`);
  // Observe a client load failure even if the Service response is still pending.
  void adapter.catch(error => aborter.abort(error));

  void (async () => {
    const result = await render;
    const styles = Promise.all((result.stylesheets || []).map(loadStylesheet));
    await styles;
    let html = '';
    for await (const message of result.messages) {
      signal.throwIfAborted();
      if (message.type === 'html') {
        html += message.html;
        container.innerHTML = html;
      }
      if (message.type === 'data') {
        const { flight } = message.snapshot as { flight: string };
        const client = await adapter;
        signal.throwIfAborted();
        if (!client) throw Error('RSC Service client failed to load');
        unmount = await client.hydrateService(container, flight, identifierPrefix, signal);
        if (signal.aborted) unmount();
      }
    }
  })().catch(error => {
    if (signal.aborted && signal.reason?.name === 'AbortError') return;
    aborter.abort(error);
    onError(error);
  });
  return () => {
    aborter.abort();
    unmount?.();
    container.replaceChildren();
  };
}

const load = document.getElementById('load')!;
const unload = document.getElementById('unmount')!;
const errorOutput = document.getElementById('error')!;
const showError = (error: unknown) => {
  errorOutput.textContent = String(error);
};

if (
  ['rsc', 'next-rsc'].includes(new URLSearchParams(location.search).get('bench') || '') &&
  document.referrer
) {
  const parentOrigin = new URL(document.referrer).origin;
  load.hidden = true;
  unload.hidden = true;
  const target = document.getElementById('one')!;
  let release: (() => void) | undefined;
  let stopObserving: (() => void) | undefined;
  const send = (message: object) => parent.postMessage(message, parentOrigin);
  const ready = () => send({ type: 'mf-lab-bench-ready' });
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== parentOrigin) return;
    if (event.data?.type === 'mf-lab-bench-query') ready();
    if (
      event.data?.type !== 'mf-lab-bench-start' ||
      !Number.isFinite(event.data.at)
    )
      return;
    stopObserving?.();
    release?.();
    errorOutput.textContent = '';
    const { id, at } = event.data;
    send({ type: 'mf-lab-bench-reset', id });
    stopObserving = observeBenchReport(target, (event, method) => {
      send({
        type: 'mf-weather',
        id,
        event,
        method,
        at: Math.round(performance.timeOrigin + performance.now() - at),
      });
    });
    release = mountService(target, nextService ? 'next' : 'v1', `report-${id}`, showError);
  });
  addEventListener('pagehide', () => {
    stopObserving?.();
    release?.();
  });
  ready();
} else {
  let cleanups: (() => void)[] = [];
  const clear = () => {
    cleanups.forEach(fn => fn());
    cleanups = [];
    errorOutput.textContent = '';
  };
  unload.onclick = clear;
  load.onclick = () => {
    clear();
    cleanups = (nextService ? ['one'] : ['one', 'two', 'three']).map((id, index) =>
      mountService(
        document.getElementById(id)!,
        nextService ? 'next' : index === 2 ? 'v2' : 'v1',
        id,
        showError,
      ),
    );
  };
  addEventListener('pagehide', clear);
}
