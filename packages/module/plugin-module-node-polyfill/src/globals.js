import Buffer from 'buffer';
import processBrowser from 'process/browser';
import console from 'console-browserify';

const buffer = {
  Buffer,
};

export { processBrowser as process, buffer, console };
