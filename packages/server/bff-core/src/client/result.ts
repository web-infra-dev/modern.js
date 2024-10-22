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

export const Err = <E = string>(value: E): Err<E> => {
  const err: Err<E> = {
    kind: 'Err',
    value,
    isErr: true,
    isOk: false,
  };
  return err;
};

export const Ok = <T, E = string>(value: T): Result<T, E> => {
  const ok: Ok<T> = {
    kind: 'Ok',
    value,
    isErr: false,
    isOk: true,
  };
  return ok;
};
