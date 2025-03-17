import type { Container } from '@modern-js/types';
import { MemoryContainer } from './container';
import { Storage } from './storage';

export { Storage } from './storage';

// for node
const memoryContainer = new MemoryContainer<string, any>();

// TODO: worker

export function createMemoryStorage<V extends {} | null>(namespace: string) {
  return new Storage<V>(namespace, memoryContainer as Container<string, V>);
}
