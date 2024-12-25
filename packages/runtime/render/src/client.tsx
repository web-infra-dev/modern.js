import { type ReactNode, createContext, use, useState } from 'react';
import {
  createFromFetch,
  createFromReadableStream,
  createServerReference,
  encodeReply,
} from 'react-server-dom-webpack/client.browser';
export { rscStream } from 'rsc-html-stream/client';
export { createFromReadableStream, createServerReference };

declare global {
  interface Window {
    __MODERN_JS_ENTRY_NAME?: string;
  }
}

const JSX_SHELL_STREAM_END_MARK = '<!--<?- SHELL_STREAM_END ?>-->';

export async function callServer(id: string, args: any[]): Promise<any> {
  const response = fetch(`/${window.__MODERN_JS_ENTRY_NAME}`, {
    method: 'POST',
    headers: {
      Accept: 'text/x-component',
      'rsc-action': id,
    },
    body: await encodeReply(args),
  });
  const res = createFromFetch(response, {
    callServer,
  });
  return res;
}

interface RootProps {
  data: Promise<React.ReactNode>;
}

export function RscClientRoot({ data }: RootProps) {
  const res = use(data);
  const [root, setRoot] = useState<React.ReactNode>(res);
  return <>{root}</>;
}

type Elements = Promise<ReactNode[]>;

const ElementsContext = createContext<Elements | null>(null);

// For users to pass an element, not a Component.
export const ServerElementsProvider = ({
  elements,
  children,
}: {
  elements: Elements;
  children: ReactNode;
}) => {
  return (
    <>
      <ElementsContext.Provider value={elements}>
        {children}
      </ElementsContext.Provider>
      {JSX_SHELL_STREAM_END_MARK}
    </>
  );
};

export const RSCServerSlot = () => {
  const elements = use(ElementsContext);
  return elements;
};
