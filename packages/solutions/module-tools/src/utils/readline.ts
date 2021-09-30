import * as readline from 'readline';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ReadlineUtils {
  static clearPrevLine(
    output: NodeJS.WriteStream & {
      fd: 1;
    },
  ) {
    ReadlineUtils.clearLine(output, 1);
  }

  static clearLine(
    output: NodeJS.WriteStream & {
      fd: 1;
    },
    n = 1,
    dir: 1 | -1 = -1,
  ) {
    // -1 向上，1 向下
    const dx = dir === 1 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      readline.moveCursor(output, 0, dx);
      readline.clearLine(output, 0);
      readline.cursorTo(output, 0);
    }
  }
}
