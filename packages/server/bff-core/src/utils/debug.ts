import { createDebugger } from '@modern-js/utils';

export const debug: (...args: unknown[]) => void = createDebugger('bff');
