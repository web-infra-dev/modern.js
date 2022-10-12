import { Writable } from 'stream';
import ansiEscapes from 'ansi-escapes';

export interface LogUpdate {
  clear: () => void;
  done: () => void;
  (str: string): void;
}

const create = (stream: Writable): LogUpdate => {
  let previousLineCount = 0;
  let previousOutput = '';
  const render = (str: string) => {
    const output = `${str}\n`;
    if (output === previousOutput) {
      return;
    }

    previousOutput = output;
    stream.write(ansiEscapes.eraseLines(previousLineCount) + output);
    previousLineCount = output.split('\n').length;
  };

  render.clear = () => {
    stream.write(ansiEscapes.eraseLines(previousLineCount));
    previousOutput = '';
    previousLineCount = 0;
  };

  render.done = () => {
    previousOutput = '';
    previousLineCount = 0;
  };

  return render;
};

export { create };
