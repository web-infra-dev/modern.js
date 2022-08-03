const LOG_PREFIX = '[web-builder]';

// TODO improve log format
export const log = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} ${message}`);
};

export const warn = (message: string) => {
  console.warn(`${LOG_PREFIX} ${message}`);
};

export const error = (message: string | Error) => {
  console.error(`${LOG_PREFIX} ${message}`);
};
