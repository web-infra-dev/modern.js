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
  try {
    const serverReference = req.headers.get('x-rsc-action');
    if (!serverReference) {
      return new Response('Cannot find server reference', { status: 404 });
    }

    const action = loadServerAction(serverReference);
    if (typeof action !== 'function') {
      console.error(
        '[RSC] Invalid action: server reference is not a function, serverReference:',
        serverReference,
      );
      return new Response('Invalid action', { status: 400 });
    }

    const contentType = req.headers.get('content-type');

    let args;
    try {
      if (contentType?.includes('multipart/form-data')) {
        const formData = await req.formData();
        args = await decodeReply(formData);
      } else {
        const text = await req.text();
        args = await decodeReply(text);
      }
    } catch (error) {
      console.error(
        '[RSC] Failed to decode request arguments, error:',
        error instanceof Error ? error.message : String(error),
        'contentType:',
        contentType || 'unknown',
      );
      return new Response('Failed to decode request arguments', {
        status: 400,
      });
    }

    // Handle both sync and async actions
    const result = await Promise.resolve(action.apply(null, args));
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(
      '[RSC] Error handling server action, error:',
      errorMessage,
      errorStack ? `\n${errorStack}` : '',
    );
    return new Response(
      `Internal server error\n${errorMessage}\n${errorStack || ''}`,
      {
        status: 500,
      },
    );
  }
};
