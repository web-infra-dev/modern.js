export type Falsy = false | null | undefined;

export type MaybePromise<T> = T | Promise<T>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
