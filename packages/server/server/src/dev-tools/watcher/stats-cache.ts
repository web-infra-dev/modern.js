import fs from 'fs';

export class StatsCache {
  private readonly cachedStats: Record<string, number> = {};

  public add(files: string[]) {
    const { cachedStats } = this;
    for (const filename of files) {
      if (fs.existsSync(filename)) {
        const stat = fs.statSync(filename);
        if (stat.isFile() && !cachedStats[filename]) {
          cachedStats[filename] = this.sign(stat);
        }
      }
    }
  }

  public refresh(filename: string) {
    const { cachedStats } = this;
    if (fs.existsSync(filename)) {
      const stat = fs.statSync(filename);
      if (stat.isFile()) {
        cachedStats[filename] = this.sign(stat);
      }
    }
  }

  public del(filename: string) {
    if (this.cachedStats[filename]) {
      delete this.cachedStats[filename];
    }
  }

  public isDiff(filename: string) {
    const { cachedStats } = this;
    const stat = fs.statSync(filename);
    const cachedStat = cachedStats[filename];

    if (this.sign(stat) !== cachedStat) {
      return true;
    }
    return false;
  }

  public has(filename: string) {
    return Boolean(this.cachedStats[filename]);
  }

  // Todo size 其实有点问题，修改单个字符会导致触发不了 change
  private sign(stat: fs.Stats) {
    return stat.size;
  }
}
