import { renderHTML } from './entry.ssr';
import { renderToReadableStream } from 'react-server-dom-rspack/server.node';
import Page from './Page';
export async function renderService(info: {
  identifierPrefix: string;
  reportEndpoint: string;
}) {
  const [htmlFlight, clientFlight] = renderToReadableStream(
    <Page endpoint={info.reportEndpoint} />,
  ).tee();
  const snapshot = new Response(clientFlight)
    .text()
    .then(flight => ({ flight }));
  const stream = await renderHTML(htmlFlight, info.identifierPrefix);
  return {
    stream,
    snapshot,
    abort(reason: unknown) {
      void stream.cancel(reason).catch(() => {});
    },
  };
}
