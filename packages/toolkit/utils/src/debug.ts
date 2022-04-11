import { debug } from '../compiled/debug';

/**
 * Create debug function with unified namespace prefix.
 * @param scope - Custom module name of your debug function.
 * @returns Debug function which namespace start with modern-js:.
 */
export const createDebugger = (scope: string) => debug(`modern-js:${scope}`);
