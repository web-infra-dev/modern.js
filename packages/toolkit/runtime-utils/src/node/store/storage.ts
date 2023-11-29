import { Container } from './container';

export class Storage<V = unknown> {
  private symbol: string;

  private container: Container<V>;

  constructor(symbol: string, containter: Container<V>) {
    this.symbol = symbol;
    this.container = containter;
  }

  /**
   * Return an array of the keys in the storage.
   *
   * This method maybe is invalidate
   */
  keys?(): string[] {
    const keys: string[] = [];

    this.forEach?.((_, k) => {
      keys.push(k);
    });
    return keys;
  }

  /**
   * Return an array of the values in the storage.
   *
   * This method maybe is invalidate
   */
  values?(): V[] {
    const values: V[] = [];

    this.forEach?.(v => {
      values.push(v);
    });
    return values;
  }

  /**
   * @returns true if an element in the Map existed and has been removed, or false if the element does not exist.
   */
  delete(key: string): boolean {
    const uniqueKey = this.computedUniqueKey(key);

    const existed = this.container.delete(uniqueKey);
    return existed;
  }

  clear?(): void {
    this.forEach?.((_, k) => {
      this.delete(k);
    });
  }

  /**
   * Executes a provided function once per each key/value pair in the store, in insertion order.
   */
  forEach?(callbackFn: (v: V, k: string, storage: this) => void): void {
    this.container.forEach?.((v, k) => {
      if (this.checkIsThisStorage(k)) {
        callbackFn(v, k, this);
      }
    });
  }

  /**
   * Returns a specified element from the containter. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Containter.
   * @returns Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.
   */
  get(key: string): V | undefined {
    const uniqueKey = this.computedUniqueKey(key);

    return this.container.get(uniqueKey);
  }

  /**
   * Adds a new element with a specified key and value to the storage. If an element with the same key already exists, the element will be updated.
   */
  set(key: string, value: V): this {
    const uniqueKey = this.computedUniqueKey(key);
    this.container.set(uniqueKey, value);

    return this;
  }

  /**
   * @returns boolean indicating whether an element with the specified key exists or not.
   */
  has(key: string): boolean {
    const uniqueKey = this.computedUniqueKey(key);
    return this.container.has(uniqueKey);
  }

  private computedUniqueKey(k: string) {
    // TODO: others computed way
    return this.symbol + k;
  }

  private checkIsThisStorage(k: string) {
    // TODO: how to check the key is this storage.
    return k.startsWith(this.symbol);
  }
}
