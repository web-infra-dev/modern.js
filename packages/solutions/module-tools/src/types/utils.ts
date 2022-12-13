// eslint-disable-next-line @typescript-eslint/ban-types
export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? DeepPartialArray<U>
  : T extends object
  ? DeepPartialObject<T>
  : T | undefined;
/** @private */
export type DeepPartialArray<T> = Array<DeepPartial<T>>;
/** @private */
export type DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> };
