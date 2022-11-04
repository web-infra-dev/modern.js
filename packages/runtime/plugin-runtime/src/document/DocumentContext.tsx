import React from 'react';

type DocumentProps = {
  [x: string]: any;
  config: Record<string, unknown>;
  templateParams: Record<string, unknown>;
  processEnv: Record<string, string>;
  children?: JSX.Element;
};

export const DocumentContext = React.createContext<DocumentProps>({
  config: {},
  templateParams: {},
  processEnv: {},
});
