import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { createModernReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';

const WeatherService = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/ServiceWeatherApplication'),
  loading: <p role="status">Connecting to the weather service…</p>,
  fallback: ({ error }) => <p role="alert">{error.message}</p>,
});

export function ServiceMount() {
  const [params] = useSearchParams();
  const late = params.has('late');
  const [mounted, setMounted] = useState(!late);
  const [connectedControls, setConnectedControls] = useState(false);
  useEffect(() => setConnectedControls(true), []);
  const started = useRef<number | undefined>(undefined);
  const container = useRef<HTMLDivElement>(null);
  const [times, setTimes] = useState<{ visible?: number; ready?: number }>({});
  useEffect(() => {
    if (!mounted || started.current === undefined || !container.current) return;
    let visible = false;
    let ready = false;
    const frames = new Set<number>();
    const inspect = () => {
      if (
        !visible &&
        container.current?.querySelector('[data-testid="weather-application"]')
      ) {
        visible = true;
        // A paint opportunity estimate, not a claim that React's effect is first paint.
        const first = requestAnimationFrame(() => {
          const second = requestAnimationFrame(() =>
            setTimes(previous => ({
              ...previous,
              visible: Math.round(performance.now() - started.current!),
            })),
          );
          frames.add(second);
        });
        frames.add(first);
      }
      if (
        !ready &&
        container.current?.querySelector(
          'input[aria-label="Adjust wind direction"]:not(:disabled)',
        )
      ) {
        ready = true;
        setTimes(previous => ({
          ...previous,
          ready: Math.round(performance.now() - started.current!),
        }));
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
      frames.forEach(cancelAnimationFrame);
    };
  }, [mounted]);
  return (
    <>
      {late && (
        <section className="producer-update-controls">
          <p>Service App loads only after Connect. Times start at the click.</p>
          <button
            data-testid="service-connect"
            disabled={!connectedControls}
            onClick={() => {
              if (mounted) {
                setMounted(false);
                started.current = undefined;
              } else {
                started.current = performance.now();
                setTimes({});
                setMounted(true);
              }
            }}
          >
            {mounted ? 'Disconnect' : 'Connect Service App'}
          </button>
          <p
            data-testid="service-mount-timing"
            data-visible-ms={times.visible}
            data-ready-ms={times.ready}
          >
            Content visible (paint estimate): {times.visible ?? '—'} ms ·
            Controls enabled: {times.ready ?? '—'} ms
          </p>
        </section>
      )}
      <div ref={container}>
        {mounted && <WeatherService label="Hangzhou" />}
      </div>
    </>
  );
}
