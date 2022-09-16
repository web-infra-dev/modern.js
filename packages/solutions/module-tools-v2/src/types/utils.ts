export type DeepPartial<T> = keyof T extends never
  ? T
  : { [k in keyof T]?: DeepPartial<T[k]> };
