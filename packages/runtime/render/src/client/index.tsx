import {
  createFromReadableStream,
  createServerReference,
} from '@modern-js/utils/react-server-dom-webpack/client.browser';
import React from 'react';
import { type ReactNode, createContext, useState } from 'react';
export { rscStream } from 'rsc-html-stream/client';
export { createFromReadableStream, createServerReference };
export { callServer } from './callServer';
export { createFromFetch } from '@modern-js/utils/react-server-dom-webpack/client.browser';

declare global {
  interface Window {
    __MODERN_JS_ENTRY_NAME?: string;
  }
}

export function RscClientRoot({
  rscPayload,
}: { rscPayload: Promise<React.ReactNode> }) {
  const elements = React.use(rscPayload);
  const [root, setRoot] = useState<React.ReactNode>(elements);
  return <>{root}</>;
}

type Elements = Promise<ReactNode[]>;

export const ElementsContext = createContext<Elements | null>(null);

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
  const elements = React.use(ElementsContext);
  return elements;
};
