import { validateFunction } from './utils';

export type Validator = ({
  inputs,
  schemas,
}: {
  inputs: any;
  schemas: any;
}) => unknown | Promise<unknown>;

let validator: Validator = () => {
  throw new Error('Please set validator first');
};

export const setValidator = (newValidator: Validator) => {
  validateFunction(newValidator, 'validator');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validator = newValidator;
};
