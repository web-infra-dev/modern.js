import React, { ReactNode } from 'react';

type DocumentStructrueContextProps = {
  hasSetHead?: boolean;
  hasSetScripts?: boolean;
  hasSetBody?: boolean;
  hasSetRoot?: boolean;
  docChild?: ReactNode;
};

export const DocumentStructrueContext =
  React.createContext<DocumentStructrueContextProps>({
    hasSetHead: false,
    hasSetScripts: false,
    hasSetBody: false,
    hasSetRoot: false,
  });
