import Buffer from 'buffer';
import console from 'console-browserify';
import processBrowser from 'process/browser';

const buffer = {
  Buffer,
};

export { processBrowser as process, buffer, console };
