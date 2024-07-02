const SERVER_ENTRY = `
import {
  #render,
  createRequestHandler,
} from '@#metaName/runtime/ssr/server';

const handleRequest = async (request, serverRoot, options) => {

  const body = await #render(request, serverRoot, options);

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      #headers
    },
  })
};

export const requestHandler = createRequestHandler(handleRequest);
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

type GenHandlerCodeOptions = {
  customServerEntry?: string | false;
  srcDirectory: string;
  internalSrcAlias: string;
  entry: string;
} & TransformServerEntryOptions;

function genHandlerCode({
  mode,
  metaName,
  customServerEntry,
  srcDirectory,
  internalSrcAlias,
}: GenHandlerCodeOptions) {
  if (customServerEntry) {
    return `export { default as requestHandler } from '${customServerEntry.replace(
      srcDirectory,
      internalSrcAlias,
    )}'`;
  } else {
    const serverEntry = transformServerEntry(SERVER_ENTRY, {
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
