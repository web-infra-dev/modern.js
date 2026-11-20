import { use } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createFromReadableStream } from 'react-server-dom-rspack/client.browser';

export function hydrateService(
  container: HTMLElement,
  flight: string,
  identifierPrefix: string,
) {
  const content = createFromReadableStream(new Blob([flight]).stream());
  function Content() {
    return use(content);
  }
  const root = hydrateRoot(container, <Content />, { identifierPrefix });
  return () => root.unmount();
}
