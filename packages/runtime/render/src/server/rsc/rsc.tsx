export { renderToReadableStream } from 'react-server-dom-webpack/server.edge';
import type { ClientManifest } from '@modern-js/types/server';
import { renderToReadableStream } from 'react-server-dom-webpack/server.edge';
import { decodeReply } from 'react-server-dom-webpack/server.edge';
export { createFromReadableStream } from 'react-server-dom-webpack/client.edge';
export {
  registerClientReference,
  registerServerReference,
} from 'react-server-dom-webpack/server';

declare const __webpack_require__: (path: string) => any;

type RenderRscOptions = {
  element: React.ReactElement;
  clientManifest: ClientManifest;
};

export const renderRsc = (options: RenderRscOptions) => {
  const readable = renderToReadableStream(
    options.element,
    options.clientManifest,
  );
  return readable;
};

type HandleActionOptions = {
  clientManifest: ClientManifest;
};

export const handleAction = async (
  req: Request,
  options: HandleActionOptions,
) => {
  const serverReference = req.headers.get('x-rsc-action');
  if (serverReference) {
    const [filepath, name] = serverReference.split('#');
    const action = __webpack_require__(filepath)[name || 'default'];
    if (action.$$typeof !== Symbol.for('react.server.reference')) {
      throw new Error('Invalid action');
    }

    const { clientManifest } = options;
    const contentType = req.headers.get('content-type');

    let args;
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      args = await decodeReply(formData);
    } else {
      const text = await req.text();
      args = await decodeReply(text);
    }

    const result = action.apply(null, args);
    const stream = renderRsc({
      element: result,
      clientManifest,
    });

    const response = new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

    return response;
  }
  return new Response('Cannot find server reference', { status: 404 });
};
