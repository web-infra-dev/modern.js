export class LoaderContext<T = unknown> {
  public symbol: symbol;

  private defaultValue?: T;

  constructor(defaultValue?: T) {
    this.defaultValue = defaultValue;
    this.symbol = Symbol('loaderContext');
  }

  getDefaultValue(): T {
    if (!this.defaultValue) {
      throw new Error("Can't get defaultValue before initialed");
    }

    return this.defaultValue;
  }
}

export function createLoaderContext<T = unknown>(defaultValue?: T) {
  return new LoaderContext(defaultValue);
}
