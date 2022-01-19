import fs from 'fs';
import crypto from 'crypto';

export class StatsCache {
  private readonly cachedHash: Record<string, string> = {};

  private readonly cachedSize: Record<string, number> = {};

  public add(files: string[]) {
    const { cachedHash, cachedSize } = this;
    for (const filename of files) {
      if (fs.existsSync(filename)) {
        const stats = fs.statSync(filename);
        if (stats.isFile() && !cachedHash[filename]) {
          cachedHash[filename] = this.hash(stats, filename);
          cachedSize[filename] = stats.size;
        }
      }
    }
  }

  public refresh(filename: string) {
    const { cachedHash, cachedSize } = this;
    if (fs.existsSync(filename)) {
      const stats = fs.statSync(filename);
      if (stats.isFile()) {
        cachedHash[filename] = this.hash(stats, filename);
        cachedSize[filename] = stats.size;
      }
    }
  }

  public del(filename: string) {
    if (this.cachedHash[filename]) {
      delete this.cachedHash[filename];
      delete this.cachedSize[filename];
    }
  }

  public isDiff(filename: string) {
    const { cachedHash, cachedSize } = this;
    const stats = fs.statSync(filename);
    const hash = cachedHash[filename];
    const size = cachedSize[filename];

    if (stats.size !== size) {
      return true;
    }

    if (this.hash(stats, filename) !== hash) {
      return true;
    }
    return false;
  }

  public has(filename: string) {
    return Boolean(this.cachedHash[filename]);
  }

  private hash(stats: fs.Stats, filename: string) {
    return crypto
      .createHash('md5')
      .update(fs.readFileSync(filename))
      .digest('hex');
  }
}
