import React, { ReactNode } from 'react';

type DocumentStructureContextProps = {
  hasSetHead?: boolean;
  hasSetScripts?: boolean;
  hasSetLinks?: boolean;
  hasSetBody?: boolean;
  hasSetRoot?: boolean;
  docChild?: ReactNode;
};

export const DocumentStructureContext =
  React.createContext<DocumentStructureContextProps>({
    hasSetHead: false,
    hasSetScripts: false,
    hasSetBody: false,
    hasSetRoot: false,
    hasSetLinks: false,
  });
