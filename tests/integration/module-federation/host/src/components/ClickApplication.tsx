import { useEffect, useRef, useState } from 'react';
import { createModernReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import type { ApplicationKind } from './application-prefetch';

const loading = <p role="status">Loading the weather application…</p>;
const fallback = ({ error }: { error: Error }) => (
  <p role="alert">{error.message}</p>
);
const Service = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/ServiceWeatherApplication'),
  loading,
  fallback,
});
const BridgeCSR = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/WeatherApplication'),
  noSSR: true,
  loading,
  fallback,
});

export function ClickApplication({ kind }: { kind: ApplicationKind }) {
  const [start, setStart] = useState<{ id: number; at: number }>();
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ready = () =>
      parent.postMessage({ type: 'mf-lab-bench-ready' }, location.origin);
    const receive = (event: MessageEvent) => {
      if (event.source !== parent || event.origin !== location.origin) return;
      if (event.data?.type === 'mf-lab-bench-query') ready();
      if (
        event.data?.type === 'mf-lab-bench-start' &&
        Number.isFinite(event.data.at)
      ) {
        parent.postMessage(
          { type: 'mf-lab-bench-reset', id: event.data.id },
          location.origin,
        );
        setStart({ id: event.data.id, at: event.data.at });
      }
    };
    addEventListener('message', receive);
    ready();
    return () => removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    if (!start || !container.current) return;
    let visible = false;
    let ready = false;
    let intersection: IntersectionObserver | undefined;
    const frames = new Set<number>();
    const publish = (event: string, method: string) =>
      parent.postMessage(
        {
          type: 'mf-weather',
          id: start.id,
          event,
          method,
          at: Math.round(performance.timeOrigin + performance.now() - start.at),
        },
        location.origin,
      );
    const inspect = () => {
      const detail = container.current?.querySelector(
        '[data-testid="weather-detail"]',
      );
      if (detail && !visible) {
        visible = true;
        intersection = new IntersectionObserver(entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          intersection!.disconnect();
          frames.add(
            requestAnimationFrame(() => {
              frames.add(
                requestAnimationFrame(() =>
                  publish('Data visible', 'visibility estimate'),
                ),
              );
            }),
          );
        });
        intersection.observe(detail);
      }
      if (
        !ready &&
        container.current?.querySelector(
          'input[aria-label="Adjust wind direction"]:not(:disabled)',
        )
      ) {
        ready = true;
        publish('Client ready', 'controls enabled after common click');
      }
    };
    const observer = new MutationObserver(inspect);
    observer.observe(container.current, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    inspect();
    return () => {
      observer.disconnect();
      intersection?.disconnect();
      frames.forEach(cancelAnimationFrame);
    };
  }, [start]);
  const Application = kind === 'service' ? Service : BridgeCSR;
  return (
    <div
      ref={container}
      data-testid={`click-${kind}`}
      data-start-at={start?.at}
    >
      {start ? (
        <Application key={start.id} label="Hangzhou" />
      ) : (
        <p>Click Load above to start</p>
      )}
    </div>
  );
}
