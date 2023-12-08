import { Container } from '@modern-js/types';

export class Storage<V = unknown> {
  private namespace: string;

  private container: Container<string, V>;

  constructor(namespace: string, containter: Container<string, V>) {
    this.namespace = namespace;
    this.container = containter;
  }

  keys?(): string[] {
    const _keys: string[] = [];
    this.forEach?.((_, k) => {
      _keys.push(k);
    });
    return _keys;
  }

  values?(): V[] {
    const _values: V[] = [];
    this.forEach?.(v => {
      _values.push(v);
    });
    return _values;
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

  delete(key: string): boolean {
    const uniqueKey = this.computedUniqueKey(key);
    return this.container.delete(uniqueKey);
  }

  clear?() {
    const keys = this.keys?.();
    keys?.forEach(key => {
      this.delete(key);
    });
  }

  forEach?(fallbackFn: (v: V, k: string, storage: this) => void) {
    this.container.forEach?.((v, k) => {
      if (this.checkIsOwnkey(k)) {
        fallbackFn(v, k, this);
      }
    });
  }

  private computedUniqueKey(k: string) {
    // TODO: use HashCode to computedUniqueKey that can reduce key's length
    // it's may increase debugging time, so we have better do this after this code is statblized.
    return `${this.namespace}:${k}`;
  }

  private checkIsOwnkey(k: string) {
    return k.startsWith(this.namespace);
  }
}
