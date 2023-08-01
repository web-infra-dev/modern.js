import { ErrorTransformer } from '../shared/types';

export const cleanMessageTransformer: ErrorTransformer = error => {
  if (error.stack) {
    error.message = error.message.replace(error.stack, '');
  }
  return error;
};
