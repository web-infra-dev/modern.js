import assert from 'assert';
import _ from '@modern-js/utils/lodash';

export const cloneInstance = <T>(error: T): T => {
  const cloned = Object.create(Object.getPrototypeOf(error));
  return _.merge(cloned, error);
};

export const cloneErrorObject = <T extends Error>(error: T): T => {
  const cloned = cloneInstance(error);
  for (const k of Object.getOwnPropertyNames(error) as (keyof T)[]) {
    cloned[k] || (cloned[k] = error[k]);
  }
  return cloned;
};

export const getErrorCause = (error: Error) => {
  assert(typeof error === 'object', 'Error must be an object');
  const err = error as any;
  return [err.cause, err.error, err.originalError].find(_.isError);
};
