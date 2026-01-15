export { renderToReadableStream } from 'react-server-dom-rspack/server.node';
import {
  loadServerAction,
  renderToReadableStream,
} from 'react-server-dom-rspack/server.node';
import { decodeReply } from 'react-server-dom-rspack/server.node';
export { createFromReadableStream } from 'react-server-dom-rspack/client.node';
export {
  registerClientReference,
  registerServerReference,
} from 'react-server-dom-rspack/server.node';

type RenderRscOptions = {
  element: React.ReactElement;
};

export const renderRsc = (options: RenderRscOptions) => {
  const readable = renderToReadableStream(options.element);
  return readable;
};

export const handleAction = async (req: Request) => {
  const serverReference = req.headers.get('x-rsc-action');
  if (serverReference) {
    const action = loadServerAction(serverReference);
    if (typeof action !== 'function') {
      throw new Error('Invalid action');
    }

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
