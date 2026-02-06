import type {
  ClientManifest,
  SSRManifest,
  SSRModuleMap,
} from '@modern-js/types/server';
import type { ReactNode } from 'react';
import type { ReactDOMServerReadableStream } from 'react-dom/server';
import { renderToReadableStream } from 'react-dom/server.edge';
import { ServerElementsProvider } from '../../client/index';

function CSSLinks({ cssFiles }: { cssFiles: string[] }) {
  if (cssFiles.length === 0) {
    return null;
  }
  return (
    <>
      {cssFiles.map(css => (
        <link key={css} href={css} rel="stylesheet" />
      ))}
    </>
  );
}

type Options = {
  request: Request;
  routes?: unknown[];
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
  const { rscRoot, routes } = options;
  const clientManifest = __rspack_rsc_manifest__?.clientManifest;
  const serverConsumerModuleMap =
    __rspack_rsc_manifest__?.serverConsumerModuleMap;
  const entryCssFiles = __rspack_rsc_manifest__?.entryCssFiles;

  const hasRoutes = Boolean(routes && routes.length > 0);

  if (!clientManifest || !serverConsumerModuleMap) {
    return renderToReadableStream(children, options);
  }

  try {
    const [{ renderRsc }, { createFromReadableStream }, { injectRSCPayload }] =
      await Promise.all([
        import('../rsc/index'),
        import('react-server-dom-rspack/client.edge'),
        import('../../rsc-html-stream/server'),
      ]);

    // Allow render rsc stream from rscRoot, or from element
    const rscStream = await renderRsc({
      element: rscRoot || children,
    });

    const [rscElementStream, rscPayloadStream] = rscStream.tee();

    const elements: Promise<ReactNode[]> =
      createFromReadableStream(rscElementStream);

    // Collect all CSS files from entryCssFiles when there are no routes
    let cssFiles: string[] = [];
    if (!hasRoutes && entryCssFiles) {
      cssFiles = Object.values(entryCssFiles).flat();
    }

    const htmlStream = await renderToReadableStream(
      <ServerElementsProvider elements={elements}>
        <CSSLinks cssFiles={cssFiles} />
        {children}
      </ServerElementsProvider>,
      options,
    );

    // Create a pipeline that injects RSC payload
    const stream = htmlStream.pipeThrough(
      injectRSCPayload(rscPayloadStream, {
        injectClosingTags: true,
      }),
    );

    return wrapStream(stream, htmlStream);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
