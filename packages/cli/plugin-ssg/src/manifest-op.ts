import path from 'path';
import { fs } from '@modern-js/utils';

type ManifestContent = Record<string, string[]>;

const CACHE_DIRECTORY = './node_modules/.cache';

const cacheDir = path.join(process.cwd(), CACHE_DIRECTORY);
const manifest = path.join(cacheDir, 'loaderManifest.json');
fs.mkdirp(cacheDir);

export const MODE: Record<string, number> = {
  STRICT: 1,
  LOOSE: 2,
  MIXIN: 3,
};

export function toKey(level: number): string {
  return `file_${level}`;
}
export class LoaderManifest {
  content: ManifestContent;

  constructor() {
    this.content = {};
    this.load();
  }

  public get(root: string, targetLevel: number): string[] {
    return Object.values(MODE).reduce((total: string[], level: number) => {
      if (level > targetLevel) {
        return total;
      }

      const key = toKey(level);
      const allow = this.content[key].filter((file: string) =>
        file.includes(root),
      );
      return total.concat(allow);
    }, []);
  }

  public add(filename: string, level: number) {
    const key = toKey(level);
    this.load();
    if (this.includes(filename, key)) {
      return;
    }

    this.cleanExist(filename);
    this.content[key].push(filename);
    this.dump();
  }

  private initContent() {
    return Object.values(MODE).reduce(
      (total: ManifestContent, level: number) => {
        const key = toKey(level);
        total[key] = [];
        return total;
      },
      {},
    );
  }

  private dump() {
    fs.writeFileSync(manifest, JSON.stringify(this.content, null, 4));
  }

  private load() {
    const exist = fs.existsSync(manifest);
    if (exist) {
      try {
        const contentStr = fs.readFileSync(manifest, 'utf-8');
        this.content = JSON.parse(contentStr);
      } catch (e) {
        throw new Error(`解析 loader mainfest 失败：${manifest}`);
      }
    } else {
      this.content = this.initContent();
    }
  }

  private includes(filename: string, key: string) {
    return this.content[key].includes(filename);
  }

  private index(filename: string, key: string) {
    return this.content[key].indexOf(filename);
  }

  private del(index: number, key: string) {
    this.content[key].splice(index, 1);
  }

  private cleanExist(filename: string) {
    Object.values(MODE).some((level: number) => {
      const key = toKey(level);

      if (this.includes(filename, key)) {
        const index = this.index(filename, key);
        this.del(index, key);
        return true;
      }

      return false;
    });
  }
}

export { manifest };
