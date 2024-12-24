import type {
  ClientManifest,
  SSRManifest,
  SSRModuleMap,
} from '@modern-js/types/server';
import { type ReactNode, use } from 'react';
import type { ReactDOMServerReadableStream } from 'react-dom/server';
import { renderToReadableStream } from 'react-dom/server.edge';
import { ServerElementsProvider } from '../../client';

type Options = {
  request: Request;
  clientManifest: ClientManifest;
  ssrManifest: SSRManifest;
} & Parameters<typeof renderToReadableStream>[1];

function wrapStream(
  stream: ReadableStream,
  originalStream: ReactDOMServerReadableStream,
): ReactDOMServerReadableStream {
  const wrappedStream = Object.create(stream);
  for (const prop of Object.keys(originalStream)) {
    if (!(prop in wrappedStream)) {
      wrappedStream[prop] =
        originalStream[prop as keyof ReactDOMServerReadableStream];
    }
  }
  return wrappedStream as ReactDOMServerReadableStream;
}

export const renderSSRStream = async (
  element: React.ReactElement,
  options: Options & { rscRoot: React.ReactElement },
): Promise<ReturnType<typeof renderToReadableStream>> => {
  const { clientManifest, ssrManifest, rscRoot } = options;
  if (clientManifest && ssrManifest) {
    try {
      const { renderRsc } = await import('../rsc');
      const { createFromReadableStream } = await import(
        'react-server-dom-webpack/client.edge'
      );
      const { injectRSCPayload } = await import('../../rsc-html-stream/server');
      const stream = await renderRsc({
        element: rscRoot ? rscRoot : element,
        clientManifest,
      });
      const [stream1, stream2] = stream.tee();
      const elements: Promise<ReactNode[]> = createFromReadableStream(stream1, {
        // Only some canary versions of react19 have this field
        serverConsumerManifest: ssrManifest,
      });

      const htmlStream = await renderToReadableStream(
        <ServerElementsProvider elements={elements}>
          {element}
        </ServerElementsProvider>,
        options,
      );

      const responseStream = wrapStream(
        htmlStream.pipeThrough(
          injectRSCPayload(stream2, {
            injectClosingTags: false,
            closeFlag: '&lt;!--&lt;?- SHELL_STREAM_END ?&gt;--&gt;',
          }),
        ),
        htmlStream,
      );
      return responseStream;
    } catch (error) {
      console.error(error);
      throw error;
    }
  } else {
    return renderToReadableStream(element, options);
  }
};
