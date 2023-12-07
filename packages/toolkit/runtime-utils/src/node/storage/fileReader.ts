import { Buffer } from 'buffer';
import { readFile, exists } from '@modern-js/utils/fs-extra';
import { Storage } from './storage';

export class FileReader {
  private storage: Storage<Buffer>;

  constructor(storage: Storage<Buffer>) {
    this.storage = storage;
  }

  async readFile(path: string, encoding: 'utf-8' | 'buffer' = 'utf-8') {
    const cache = this.storage.get(path);
    if (cache) {
      return this.encodingContent(cache, encoding);
    }

    const exist = await new Promise<boolean>(resolve => {
      exists(path, e => {
        resolve(e);
      });
    });

    if (exist) {
      const content = await readFile(path);

      this.storage.set(path, content);

      return this.encodingContent(content, encoding);
    } else {
      // if is not exist, return a empty buffer.
      return this.encodingContent(Buffer.from([]), encoding);
    }
  }

  private encodingContent(value: Buffer, encoding: 'utf-8' | 'buffer') {
    if (encoding === 'utf-8') {
      return value.toString();
    }

    return value;
  }
}
