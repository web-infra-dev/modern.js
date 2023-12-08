import type { Buffer } from 'buffer';
import { readFile, stat } from '@modern-js/utils/fs-extra';
import { Storage } from './storer/storage';
import { createMemoryStorage } from './storer';

export class FileReader {
  private storage: Storage<Buffer | null>;

  constructor(storage: Storage<Buffer | null>) {
    this.storage = storage;
  }

  async readFile(path: string, encoding: 'utf-8' | 'buffer' = 'utf-8') {
    const cache = this.storage.get(path);
    if (cache === null) {
      return null;
    }
    if (cache) {
      return this.encodingContent(cache, encoding);
    }

    const isExistFile = await new Promise(resolve => {
      stat(path, (err, stats) => {
        if (err) {
          resolve(false);
          return;
        }
        if (stats.isFile()) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

    if (isExistFile) {
      const content = await readFile(path);

      this.storage.set(path, content);

      return this.encodingContent(content, encoding);
    } else {
      // if is not exist, return null value.
      this.storage.set(path, null);
      return null;
    }
  }

  private encodingContent(value: Buffer, encoding: 'utf-8' | 'buffer') {
    if (encoding === 'utf-8') {
      return value.toString();
    }

    return value;
  }
}

export const fileReader = new FileReader(createMemoryStorage('__file__system'));
