import { Buffer } from 'buffer';
import { fs as extraFS } from '@modern-js/utils';
import type { IFs } from 'memfs';
import LRU from 'lru-cache';

const Byte = 1;
const KB = 1024 * Byte;
const MB = 1024 * KB;

type FileCache = {
  content: Buffer;
  mtime: Date;
};

const getContentLength = (cache: FileCache) => cache.content.length;

const createCacheItem = async (content: Buffer, mtime: Date) => {
  return {
    content,
    mtime,
  };
};
export class LruReader {
  private readonly cache: LRU<string, FileCache>;

  // private timer?: NodeJS.Timeout;

  private fs!: IFs;

  constructor() {
    this.cache = new LRU({
      max: 256 * MB,
      length: getContentLength,
      maxAge: 5 * 60 * 5000, // 60s
    });
  }

  public init(fs?: IFs) {
    this.fs = fs || (extraFS as unknown as IFs);
  }

  public close() {
    // empty
  }

  public async read(filepath: string) {
    const { fs } = this;
    if (this.cache.has(filepath)) {
      const { content } = this.cache.get(filepath)!;
      return { content };
    }

    if (!fs.existsSync(filepath)) {
      return null;
    }

    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      return null;
    }

    // if file more than 20 MB
    if (stat.size > 20 * MB) {
      return null;
    }

    const content = (await fs.promises.readFile(filepath)) as Buffer;
    const item = await createCacheItem(content, stat.mtime);
    this.cache.set(filepath, item);
    return item;
  }

  public update() {
    const { cache, fs } = this;
    const files = cache.keys();

    for (const filepath of files) {
      if (!fs.existsSync(filepath)) {
        cache.del(filepath);
      }

      try {
        const item = cache.get(filepath)!;
        const stat = fs.statSync(filepath);
        const { mtime } = stat;
        // file is modify
        if (item.mtime < mtime) {
          cache.del(filepath);
        }
      } catch (e) {
        // for safe
        cache.del(filepath);
      }
    }
  }

  // private timeTask() {
  // this.timer = setInterval(() => this.update, 5 * 60 * 1000).unref();
  // }
}

const reader = new LruReader();

export const readFile = async (filepath: string) => {
  const file = await reader.read(filepath);
  return file?.content;
};

export const updateFile = () => {
  reader.update();
};

export const init = (fs?: IFs) => {
  reader.init(fs);
};

export const close = () => {
  reader.close();
};
