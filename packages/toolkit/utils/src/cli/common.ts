import debug from '../../compiled/debug';

/**
 * Create debug function with unified namespace prefix.
 * @param scope - Custom module name of your debug function.
 * @returns Debug function which namespace start with modern-js:.
 */
export const createDebugger = (scope: string) => debug(`modern-js:${scope}`);

export const clearConsole = () => {
  if (process.stdout.isTTY && !process.env.DEBUG) {
    process.stdout.write('\x1B[H\x1B[2J');
  }
};

export const wait = (time = 0) =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });
