import { useMemo } from 'react';
import { proxy } from 'valtio';

export const useProxyFrom = <T extends object>(initializer: () => T) => {
  return useMemo(() => proxy(initializer()), []);
};
