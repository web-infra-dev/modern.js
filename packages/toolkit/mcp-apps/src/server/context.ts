import type { RegisterUiOptions } from './resources';

// Associate framework configuration with the request passed to the BFF server factory.
// Weak keys keep concurrent applications isolated without retaining requests.
export const requestUiOptions = new WeakMap<
  Request,
  Pick<RegisterUiOptions, 'manifest' | 'mode'>
>();
