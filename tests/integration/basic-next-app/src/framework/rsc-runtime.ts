export { renderToReadableStream } from 'react-server-dom-webpack/server.edge';
import path from 'node:path';
import { decodeReply } from 'react-server-dom-webpack/server.edge';

declare const __webpack_require__: (path: string) => any;

export const handleAction = async (req: Request, distDir: string) => {
  const serverReference = req.headers.get('rsc-action');
  if (serverReference) {
    const [filepath, name] = serverReference.split('#');
    const action = __webpack_require__(filepath)[name];
    if (action.$$typeof !== Symbol.for('react.server.reference')) {
      throw new Error('Invalid action');
    }

    let args;
    if (req.headers.get('content-type') === 'multipart/form-data') {
      const formData = await req.formData();
      args = await decodeReply(formData);
    } else {
      const text = await req.text();
      args = await decodeReply(text);
    }
    const result = action.apply(null, args);
    try {
      await result;
    } catch (x) {}

    const { renderRsc, ServerRoot } = await import('./ServerRoot');
    const stream = await renderRsc({
      Component: ServerRoot,
      distDir,
      returnValue: result,
    });

    const response = new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

    return response;
  }
};
