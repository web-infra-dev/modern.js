import { createContext } from 'react';

/** Props on the actual ModernRoot element, scoped to its application subtree. */
export const ApplicationRootPropsContext = createContext<
  Record<string, unknown> | undefined
>(undefined);
