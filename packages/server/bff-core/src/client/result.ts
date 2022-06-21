export type Err<T = unknown> = {
  kind: 'Err';
  value: T;
  isErr: true;
  isOk: false;
};

export type Ok<T = unknown> = {
  kind: 'Ok';
  value: T;
  isErr: false;
  isOk: true;
};

export type Result<T = unknown, E = string> = Err<E> | Ok<T>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Err = <E = string>(value: E): Err<E> => {
  const err: Err<E> = {
    kind: 'Err',
    value,
    isErr: true,
    isOk: false,
  };
  return err;
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Ok = <T, E = string>(value: T): Result<T, E> => {
  const ok: Ok<T> = {
    kind: 'Ok',
    value,
    isErr: false,
    isOk: true,
  };
  return ok;
};
