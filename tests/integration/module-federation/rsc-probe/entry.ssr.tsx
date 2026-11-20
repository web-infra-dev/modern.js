import { createFromReadableStream } from 'react-server-dom-rspack/client.node';
import { renderToReadableStream } from 'react-dom/server.edge';
export async function renderHTML(
  flight: ReadableStream<Uint8Array>,
  identifierPrefix: string,
) {
  return renderToReadableStream(await createFromReadableStream(flight), {
    identifierPrefix,
  });
}
