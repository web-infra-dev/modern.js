import { type FC, createContext, useContext, useMemo } from 'react';
import type { Promisable } from 'type-fest';
import { proxy } from 'valtio';

export function createStoreContext<T extends object>(
  initializer: () => Promisable<T>,
) {
  const InnerContext = createContext<unknown>(null);
  const Provider: FC<{ children: React.ReactElement }> = ({ children }) => {
    const _value = useMemo(() => initializer(), []);
    return (
      <InnerContext.Provider value={proxy(_value)}>
        {children}
      </InnerContext.Provider>
    );
  };
  const _use = () => useContext(InnerContext) as T;
  return {
    Provider,
    use: _use,
  };
}
