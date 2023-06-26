import { ErrorTransformer } from '../shared/types';

export const cleanMessageTransformer: ErrorTransformer = error => {
  const { raw } = error;
  if (raw.stack) {
    error.message = error.message.replace(raw.stack, '');
  }
  return error;
};
