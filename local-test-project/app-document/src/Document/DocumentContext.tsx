import React from 'react';

type DocumentProps = {
  [x: string]: any;
  filterXss?: string | false;
  injectScript?: JSX.Element[];
  injectCSS?: JSX.Element[];
  children?: JSX.Element;
  initialProps?: unknown;
};

export const DocumentContext = React.createContext<DocumentProps>({});
