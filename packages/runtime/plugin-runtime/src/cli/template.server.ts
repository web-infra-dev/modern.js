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
      'content-type': 'text/html; charset=utf-8',
      #headers
    },
  })
};

export const requestHandler = createRequestHandler(handleRequest);
`;

const SERVER_ENTRY_RSC = `
import {
  #render,
  createRequestHandler,
} from '@#metaName/runtime/ssr/server';
import { RSCServerSlot } from '@#metaName/runtime/rsc/client';
export { handleAction } from '@#metaName/runtime/rsc/server';

const handleRequest = async (request, ServerRoot, options) => {

  const body = await #render(request,
    <ServerRoot>
      <RSCServerSlot />
    </ServerRoot>,
    {
      ...options,
      rscRoot: <options.RSCRoot />,
    },
  );

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      #headers
    },
  })
};

export const requestHandler = createRequestHandler(handleRequest, {
  enableRsc: true,
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
}: {
  metaName: string;
}) => {
  return `
  import App from './AppProxy';
  import { renderRsc } from '@${metaName}/runtime/rsc/server'
  export { handleAction } from '@${metaName}/runtime/rsc/server';


  export const renderRscHandler = ({
    clientManifest
  }) => {
    const stream = renderRsc({
      element: <App/>,
      clientManifest,
    })

    const response = new Response(stream, {
      headers: {
        'Transfer-Encoding': 'chunked',
      },
    });
    return response
  }
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
    .replace(/#render/g, mode === 'string' ? 'renderString' : 'renderStreaming')
    .replace(
      /#headers/g,
      mode === 'string' ? '' : `'transfer-encoding': 'chunked',`,
    );

  return output;
}
