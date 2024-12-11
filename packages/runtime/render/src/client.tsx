import {
  type ReactNode,
  createContext,
  use,
  useContext,
  useState,
} from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import {
  createFromFetch,
  createFromReadableStream,
  encodeReply,
} from 'react-server-dom-webpack/client.browser';
export { rscStream } from 'rsc-html-stream/client';
export { createFromReadableStream };

export async function callServer(id: string, args: any[]): Promise<any> {
  const response = fetch('/', {
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

// 为了用户传递的是 element，而不是 Component
export const ServerElementsProvider = ({
  elements,
  children,
}: {
  elements: Elements;
  children: ReactNode;
}) => {
  return (
    <ElementsContext.Provider value={elements}>
      {children}
      &lt;!--&lt;?- SHELL_STREAM_END ?&gt;--&gt;
    </ElementsContext.Provider>
  );
};

export const ServerSlot = () => {
  const elements = useContext(ElementsContext);
  return <>{elements}</>;
};
