import { createPrimaryContext } from '../core/createContext';
import type { StubBuilderOptions } from './builder';

export function createStubContext(options: Required<StubBuilderOptions>) {
  return createPrimaryContext(options, options.builderConfig);
}
