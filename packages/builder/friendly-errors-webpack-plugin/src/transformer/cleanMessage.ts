import { ErrorTransformer } from '../shared/types';

export const transformCleanMessage: ErrorTransformer = error => {
  if (error.stack && error.message.includes(error.stack)) {
    error.message = error.message.replace(error.stack, '');
  } else {
    const indexOfStack = error.message.indexOf(error.trace[0].beforeParse);
    if (indexOfStack > -1) {
      error.message = error.message.slice(0, indexOfStack).trimEnd();
    }
  }
  const cause = error.causes[0];
  cause && transformCleanMessage(cause);
  return error;
};
