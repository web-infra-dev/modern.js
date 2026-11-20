export function observeBenchReport(
  container: HTMLElement,
  publish: (event: string, method: string) => void,
) {
  let visible = false;
  let ready = false;
  let complete = false;
  let intersection: IntersectionObserver | undefined;
  let observed: Element | null = null;
  const frames = new Set<number>();
  const inspect = () => {
    const detail = container.querySelector(
      '[data-testid="weather-detail"], [data-testid="weather-report"]',
    );
    if (!visible && detail !== observed) {
      observed = detail;
      intersection?.disconnect();
      if (detail) {
        intersection = new IntersectionObserver(entries => {
          if (
            !detail.isConnected ||
            !entries.some(entry => entry.isIntersecting)
          )
            return;
          visible = true;
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
    }
    if (
      !complete &&
      container.querySelector('[data-report-complete]') &&
      container.querySelectorAll('[data-report-chart] svg').length === 6
    ) {
      complete = true;
      frames.add(
        requestAnimationFrame(() =>
          frames.add(
            requestAnimationFrame(() =>
              publish('Content complete', 'all report sections committed'),
            ),
          ),
        ),
      );
    }
    if (
      !ready &&
      container.querySelector(
        'input[aria-label="Adjust wind direction"]:not(:disabled), [data-report-interactive="true"]',
      )
    ) {
      ready = true;
      publish('Client ready', 'controls enabled after common click');
    }
  };
  const observer = new MutationObserver(inspect);
  observer.observe(container, {
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
}
