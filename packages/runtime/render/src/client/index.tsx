import { type ReactNode, createContext, use, useState } from 'react';
import {
  createFromReadableStream,
  createServerReference,
} from 'react-server-dom-webpack/client.browser';
export { rscStream } from 'rsc-html-stream/client';
export { createFromReadableStream, createServerReference };
export { callServer } from './callServer';
export { createFromFetch } from 'react-server-dom-webpack/client.browser';

declare global {
  interface Window {
    __MODERN_JS_ENTRY_NAME?: string;
  }
}

interface RootProps {
  data: Promise<React.ReactNode>;
}

export function RscClientRoot({ data }: RootProps) {
  const elements = use(data);
  const [root, setRoot] = useState<React.ReactNode>(elements);
  return <>{root}</>;
}

type Elements = Promise<ReactNode[]>;

const ElementsContext = createContext<Elements | null>(null);

// For users to pass an element, not a Component.
const JSX_SHELL_STREAM_END_MARK = '<!--<?- SHELL_STREAM_END ?>-->';
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
