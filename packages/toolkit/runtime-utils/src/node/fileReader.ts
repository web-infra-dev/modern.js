import type { Buffer } from 'buffer';
import Fs from '@modern-js/utils/fs-extra';
import { Storage } from './storer/storage';
import { createMemoryStorage } from './storer';

export class FileReader {
  private storage: Storage<Buffer | null>;

  private fs: typeof Fs;

  constructor(storage: Storage<Buffer | null>) {
    this.fs = Fs;
    this.storage = storage;
  }

  async readFile(path: string, encoding?: 'utf-8'): Promise<string | null>;
  async readFile(path: string, encoding?: 'buffer'): Promise<Buffer | null>;
  async readFile(
    path: string,
    encoding: 'utf-8' | 'buffer' = 'utf-8',
  ): Promise<string | Buffer | null> {
    const { fs } = this;
    const cache = await this.storage.get(path);
    if (cache === null) {
      return null;
    }
    if (cache) {
      return this.encodingContent(cache, encoding);
    }

    const isExistFile = await new Promise(resolve => {
      fs.stat(path, (err, stats) => {
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
      const content = await fs.promises.readFile(path);

      this.storage.set(path, content);

      return this.encodingContent(content, encoding);
    } else {
      // if is not exist, return null value.
      this.storage.set(path, null);
      return null;
    }
  }

  /**
   * Clear the fileCache entriely.
   */
  reset(fs?: typeof Fs) {
    // FIXME: make me more safyly.
    fs && (this.fs = fs);
    return this.storage.clear?.() as Promise<void>;
  }

  private encodingContent(value: Buffer, encoding: 'utf-8' | 'buffer') {
    if (encoding === 'utf-8') {
      return value.toString();
    }

    return value;
  }
}

export const fileReader = new FileReader(createMemoryStorage('__file__system'));
