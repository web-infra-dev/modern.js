import { createContext, FC, useContext, useMemo } from 'react';
import { proxy } from 'valtio';
import { Promisable } from 'type-fest';

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
