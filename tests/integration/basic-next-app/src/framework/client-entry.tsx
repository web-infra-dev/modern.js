import { createRoot, hydrateRoot } from 'react-dom/client';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useEffect, useState, use, startTransition } from 'react';
import {
  createFromFetch,
  encodeReply,
  createFromReadableStream,
} from 'react-server-dom-webpack/client';
import { rscStream } from 'rsc-html-stream/client';

function fetchRSC() {
  const url = '/rsc';
  const content = createFromFetch(
    fetch(url, {
      headers: {
        Accept: 'text/x-component',
      },
    }),
    {
      callServer,
    },
  );
  return content;
}

export async function callServer(id: string, args: any[]): Promise<any> {
  const response = fetch('/', {
    method: 'POST',
    headers: {
      Accept: 'text/x-component',
      'rsc-action': id,
    },
    body: await encodeReply(args),
  });
  const { returnValue, root } = await createFromFetch(response, {
    callServer,
  });
  startTransition(() => {
    updateRoot(root);
  });
  return returnValue;
}

const data = createFromReadableStream(rscStream);

// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
function Error({ error }: FallbackProps) {
  return (
    <div>
      <h1>Application Error</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
    </div>
  );
}

// for call server
let updateRoot: (root: React.ReactNode) => void;

interface RootProps {
  data: Promise<React.ReactNode>;
}

function Root({ data }: RootProps) {
  const [root, setRoot] = useState<React.ReactNode>(use(data));
  updateRoot = setRoot;
  return <ErrorBoundary fallback={Error}>{root}</ErrorBoundary>;
}

hydrateRoot(document.body, <Root data={data} />);
