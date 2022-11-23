import React from 'react';

type DocumentProps = {
  [x: string]: any;
  config?: any;
  templateParams: {
    [y: string]: any;
    mountId?: string;
  };
  processEnv?: Record<string, string | undefined>;
  children?: JSX.Element;
};

export const DocumentContext = React.createContext<DocumentProps>({
  config: {},
  templateParams: {},
  processEnv: {},
});
