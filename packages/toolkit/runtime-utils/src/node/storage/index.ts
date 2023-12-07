import { Container } from '@modern-js/types';
import { FileReader } from './fileReader';
import { MemoryContainer } from './container';
import { Storage } from './storage';

export type { FileReader } from './fileReader';
export { Storage } from './storage';

// for node
const memoryContainer = new MemoryContainer();

// TODO: worker

export function createMemoryStorage<V = unknown>(namespace: string) {
  return new Storage<V>(namespace, memoryContainer as Container<string, V>);
}

export const fileReader = new FileReader(createMemoryStorage('__file__system'));
