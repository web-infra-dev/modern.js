import { Container, MemoryContainer } from './container';
import { Storage } from './storage';
import { FileReader } from './fileReader';

export class Store {
  private defaultContainer: Container<any>;

  private customContainer?: Container<any>;

  private id: number = 0;

  constructor(
    defaultContainer: Container<unknown>,
    customContainer?: Container<unknown>,
  ) {
    this.defaultContainer = defaultContainer;
    this.customContainer = customContainer;
  }

  createContainer<V = unknown>(type: 'default' | 'custom' = 'default') {
    const symbol = this.generateSymbol();

    if (type === 'default') {
      return new Storage<V>(symbol, this.defaultContainer);
    } else if (this.customContainer) {
      return new Storage<V>(symbol, this.customContainer);
    } else {
      return new Storage<V>(symbol, this.defaultContainer);
    }
  }

  private generateSymbol() {
    // TODO: how to generate symbol
    return `__modern__${this.id++}`;
  }
}

const memoryContainer = new MemoryContainer();
export const store = new Store(memoryContainer);

export const fileReader = new FileReader(store.createContainer());
