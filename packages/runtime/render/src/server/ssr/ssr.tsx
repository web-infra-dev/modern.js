import type {
  ClientManifest,
  SSRManifest,
  SSRModuleMap,
} from '@modern-js/types/server';
import type { ReactNode } from 'react';
import type { ReactDOMServerReadableStream } from 'react-dom/server';
import { renderToReadableStream } from 'react-dom/server.edge';
import { ServerElementsProvider } from '../../client/index';

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
  children: React.ReactNode,
  options: Options & { rscRoot: React.ReactElement },
): Promise<ReturnType<typeof renderToReadableStream>> => {
  const { clientManifest, ssrManifest, rscRoot } = options;

  if (!clientManifest || !ssrManifest) {
    return renderToReadableStream(children, options);
  }

  try {
    const [{ renderRsc }, { createFromReadableStream }, { injectRSCPayload }] =
      await Promise.all([
        import('../rsc/index'),
        import('react-server-dom-webpack/client.edge'),
        import('../../rsc-html-stream/server'),
      ]);

    // Allow render rsc stream from rscRoot, or from element
    const rscStream = await renderRsc({
      element: rscRoot || children,
      clientManifest,
    });

    const [rscElementStream, rscPayloadStream] = rscStream.tee();

    const elements: Promise<ReactNode[]> = createFromReadableStream(
      rscElementStream,
      {
        serverConsumerManifest: ssrManifest,
      },
    );

    const htmlStream = await renderToReadableStream(
      <ServerElementsProvider elements={elements}>
        {children}
      </ServerElementsProvider>,
      options,
    );

    return wrapStream(
      htmlStream.pipeThrough(
        injectRSCPayload(rscPayloadStream, {
          injectClosingTags: false,
        }),
      ),
      htmlStream,
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};
