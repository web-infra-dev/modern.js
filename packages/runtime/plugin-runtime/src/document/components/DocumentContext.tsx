import React from 'react';

type DocumentContextProps = {
  //   [x: string]: any;
  mountId: string;
  title: string;
  assetPrefix: string;
  meta: any;
};

export const DocumentContext = React.createContext<
  Partial<DocumentContextProps>
>({});
