export type Err<T = any> = {
  kind: 'Err';
  value: T;
  isErr: true;
  isOk: false;
};

export type Ok<T = any> = {
  kind: 'Ok';
  value: T;
  isErr: false;
  isOk: true;
};

export type Result<T = any, E = string> = Err<E> | Ok<T>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Err = <E = string>(value: E): Err<E> => {
  const err: Err = {
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
