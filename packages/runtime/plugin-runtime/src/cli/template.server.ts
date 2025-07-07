import { formatImportPath } from '@modern-js/utils';

const SERVER_ENTRY = `
import {
  #render,
  createRequestHandler,
} from '@#metaName/runtime/ssr/server';

const handleRequest = async (request, ServerRoot, options) => {

  const body = await #render(request, <ServerRoot />, options);

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8'
    },
  })
};

export const requestHandler = createRequestHandler(handleRequest);
`;

const SERVER_ENTRY_RSC = `
import {
  renderStreaming,
  createRequestHandler,
} from '@#metaName/runtime/ssr/server';
import { RSCServerSlot } from '@#metaName/runtime/rsc/client';
import { renderRsc } from '@#metaName/runtime/rsc/server';
export { handleAction } from '@#metaName/runtime/rsc/server';

const handleRequest = async (request, ServerRoot, options) => {

  const body = await renderStreaming(request,
    <ServerRoot>
      <RSCServerSlot />
    </ServerRoot>,
    {
      ...options,
      rscRoot: options.rscRoot || <options.RSCRoot />,
    },
  );

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8'
    },
  })
};

export const requestHandler = createRequestHandler(handleRequest, {
  enableRsc: true
});

const handleRSCRequest = async (request, ServerRoot, options) => {
  const { serverPayload } = options;
  const stream = renderRsc({
    element: options.rscRoot,
    clientManifest: options.rscClientManifest!,
  });

  return new Response(stream);
}


export const rscRequestHandler = createRequestHandler(handleRSCRequest, {
  enableRsc: true
});
`;

type ServerIndexOptinos = GenHandlerCodeOptions & {
  entryName: string;
};

export const serverIndex = (options: ServerIndexOptinos) => {
  const { metaName = 'modern-js', entryName } = options;

  return `
    import '@${metaName}/runtime/registry/${entryName}';
    ${genHandlerCode(options)}
  `;
};

export const entryForCSRWithRSC = ({
  metaName,
  entryName,
}: {
  metaName: string;
  entryName: string;
}) => {
  return `
  import '@${metaName}/runtime/registry/${entryName}';
  import {
    createRequestHandler,
  } from '@${metaName}/runtime/ssr/server';
  import { renderRsc, processRSCStream } from '@${metaName}/runtime/rsc/server'
  export { handleAction } from '@${metaName}/runtime/rsc/server';

  const handleCSRRender = async (request, ServerRoot, options) => {
    const rscPayloadStream = renderRsc({
      element: options.rscRoot || <options.RSCRoot/>,
      clientManifest: options.rscClientManifest!,
    });
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        controller.enqueue(encoder.encode(options.html));

      processRSCStream(rscPayloadStream, controller, encoder)
        .catch(err => {
          controller.error(err);
        });
      }
    });

    return new Response(stream, {
      status: 200,
      headers: new Headers({
        'content-type': 'text/html; charset=UTF-8',
      }),
    });
  }

  export const renderRscStreamHandler = createRequestHandler(handleCSRRender, {
    enableRsc: true
  });

  const handleRequest = async (request, ServerRoot, options) => {
    const stream = renderRsc({
            element: options.rscRoot || <options.RSCRoot/>,
      clientManifest: options.rscClientManifest!,
    });

    return new Response(stream);
  }

  export const rscRequestHandler = createRequestHandler(handleRequest, {
    enableRsc: true
  });
`;
};

type GenHandlerCodeOptions = {
  customServerEntry?: string | false;
  srcDirectory: string;
  internalSrcAlias: string;
  entry: string;
  enableRsc?: boolean;
} & TransformServerEntryOptions;

function genHandlerCode({
  mode,
  metaName,
  customServerEntry,
  srcDirectory,
  internalSrcAlias,
  enableRsc,
}: GenHandlerCodeOptions) {
  if (customServerEntry) {
    const realEntryPath = formatImportPath(
      customServerEntry.replace(srcDirectory, internalSrcAlias),
    );
    return `
      export * from '${realEntryPath}';
      export { default as requestHandler } from '${realEntryPath}'`;
  } else {
    const entrySource = enableRsc ? SERVER_ENTRY_RSC : SERVER_ENTRY;
    const serverEntry = transformServerEntry(entrySource, {
      metaName: metaName || 'modern-js',
      mode,
    });

    return serverEntry;
  }
}

type TransformServerEntryOptions = {
  metaName?: string;
  mode: 'string' | 'stream';
};

function transformServerEntry(
  source: string,
  options: TransformServerEntryOptions,
) {
  const { metaName = 'modern-js', mode } = options;

  const output = source
    .replace(/#metaName/g, metaName)
    .replace(
      /#render/g,
      mode === 'string' ? 'renderString' : 'renderStreaming',
    );

  return output;
}
