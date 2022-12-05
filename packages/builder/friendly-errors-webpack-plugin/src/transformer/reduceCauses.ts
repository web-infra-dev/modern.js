import { ErrorTransformer } from '../shared/types';

export const transformReduceCauses: ErrorTransformer = error => {
  const cause = error.causes[0];
  if (!cause) {
    return error;
  }
  const msgEquals = error.message.includes(cause.message);
  const stackEquals =
    error.stack === cause.stack ||
    (error.stack && cause.stack && error.stack.includes(cause.stack));
  if (msgEquals && stackEquals) {
    error.causes.splice(0, 1);
    delete error.cause;
  }
  return error;
};
