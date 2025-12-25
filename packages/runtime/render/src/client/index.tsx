import React from 'react';
import { type ReactNode, createContext, useState } from 'react';
import {
  createFromReadableStream,
  createServerReference,
} from 'react-server-dom-webpack/client.browser';
export { rscStream } from '../rsc-html-stream/client';
export { createFromReadableStream, createServerReference };
export { callServer } from './callServer';
export { createFromFetch } from 'react-server-dom-webpack/client.browser';

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
    </>
  );
};

export const RSCServerSlot = () => {
  const elements = React.use(ElementsContext);
  return elements;
};
