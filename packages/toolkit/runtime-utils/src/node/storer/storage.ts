import { Container } from '@modern-js/types';

export class Storage<V = unknown> {
  private namespace: string;

  private container: Container<string, V>;

  constructor(namespace: string, container: Container<string, V>) {
    this.namespace = namespace;
    this.container = container;
  }

  async keys?(): Promise<string[]> {
    const _keys: string[] = [];
    this.forEach?.((_, k) => {
      _keys.push(k);
    });
    return _keys;
  }

  async values?(): Promise<V[]> {
    const _values: V[] = [];
    this.forEach?.(v => {
      _values.push(v);
    });
    return _values;
  }

  /**
   * Returns a specified element from the container. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Container.
   * @returns Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.
   */
  get(key: string): Promise<V | undefined> {
    const uniqueKey = this.computedUniqueKey(key);

    return this.container.get(uniqueKey);
  }

  /**
   * Adds a new element with a specified key and value to the storage. If an element with the same key already exists, the element will be updated.
   */
  async set(key: string, value: V): Promise<this> {
    const uniqueKey = this.computedUniqueKey(key);
    await this.container.set(uniqueKey, value);

    return this;
  }

  /**
   * @returns boolean indicating whether an element with the specified key exists or not.
   */
  has(key: string): Promise<boolean> {
    const uniqueKey = this.computedUniqueKey(key);
    return this.container.has(uniqueKey);
  }

  delete(key: string): Promise<boolean> {
    const uniqueKey = this.computedUniqueKey(key);
    return this.container.delete(uniqueKey);
  }

  async clear?() {
    const keys = await this.keys?.();
    await Promise.all(
      keys?.map(async key => {
        return this.delete(key);
      }) || [],
    );
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
