export type HandleSuccess<T> = {
  type: 'HandleSuccess';
  value: T;
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const HandleSuccess = <T>(output: T): HandleSuccess<T> => ({
  type: 'HandleSuccess',
  value: output,
});

export type InputValidationError = {
  type: 'InputValidationError';
  message: string;
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const InputValidationError = (
  message: string,
): InputValidationError => ({
  type: 'InputValidationError',
  message,
});

export type OutputValidationError = {
  type: 'OutputValidationError';
  message: string;
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const OutputValidationError = (
  message: string,
): OutputValidationError => ({
  type: 'OutputValidationError',
  message,
});

export type HandleResult<T> =
  | HandleSuccess<T>
  | InputValidationError
  | OutputValidationError;
