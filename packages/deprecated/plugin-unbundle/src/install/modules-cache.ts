import os from 'os';
import path from 'path';
import { fs, signale as logger } from '@modern-js/utils';
import fetch from 'node-fetch';

const createCacheDir = (name: string): string => {
  switch (os.platform()) {
    case 'darwin': {
      return path.join(os.homedir(), 'Library', 'Caches', name);
    }
    case 'win32': {
      return path.join(os.homedir(), 'AppData', 'Local', name, 'Cache');
    }
    // posix(linux, freebsd)
    default: {
      return path.join(os.homedir(), '.cache', name);
    }
  }
};

export const CACHE_LOCK_FILE = 'modules-cache-lock.json';

interface ResponseType {
  code: number;
  message: string;
  data: {
    content: string;
    meta: string[];
  };
}

const request = async (
  urlPath: string,
  pdnHost: string,
): Promise<ResponseType> => {
  const response = await fetch(
    `http:${process.env.PDN_HOST || pdnHost}/${urlPath}`,
    {
      method: 'GET',
      redirect: 'follow',
    },
  );

  const json = (await response.json()) as ResponseType;

  return json;
};

export type CacheItem = {
  dependencies: string[];
  file: string;
};

export type CacheJson = Record<string, CacheItem>;

export const normalizeSemverSpecifierVersion = (
  specifier: string,
): { name: string; versionRange?: string } => {
  let versionStart = 0;
  let versionEnd = 0;

  if (specifier.startsWith('/esm/bv/')) {
    specifier = specifier.replace(/^\/esm\/bv\//, '');
  }

  for (let i = 1; i < specifier.length; i++) {
    if (specifier[i] === '@') {
      versionStart = i;
    }

    if ((i === specifier.length - 1 || specifier[i] === '/') && versionStart) {
      versionEnd = specifier[i] === '/' ? i : i + 1;
      break;
    }
  }

  if (versionStart) {
    return {
      name:
        specifier.substring(0, versionStart) + specifier.substring(versionEnd),
      versionRange: specifier.substring(versionStart + 1, versionEnd),
    };
  }

  return { name: specifier };
};
export class ModulesCache {
  dir: string;

  lockfile!: string;

  cachedMap!: CacheJson;

  constructor(id: string) {
    this.dir = createCacheDir(id);

    this.initCacheDir();
  }

  clean() {
    fs.removeSync(this.dir);
    this.initCacheDir();
  }

  initCacheDir() {
    fs.ensureDirSync(this.dir);

    this.lockfile = path.join(this.dir, CACHE_LOCK_FILE);

    fs.ensureFileSync(this.lockfile);

    const content = fs.readFileSync(this.lockfile, 'utf8').trim();

    this.cachedMap = content ? JSON.parse(content) : {};
  }

  // add new cache item or update existed cache item
  set(name: string, version: string, content: string, dependencies: string[]) {
    const key = `${name}@${version}`;
    const file = path.join(this.dir, `${key}.js`);
    const metajson = this.cachedMap;
    fs.outputFileSync(file, content, 'utf8');
    metajson[key] = {
      dependencies,
      file,
    };
    this.cachedMap = metajson;
    this._updatelock();
    return file;
  }

  // TODO: solve @latest version not updating
  has(name: string, version: string) {
    return this.cachedMap.hasOwnProperty(`${name}@${version}`);
  }

  get(name: string, version: string) {
    if (this.has(name, version)) {
      return this.cachedMap[`${name}@${version}`];
    }
  }

  // write cache map json to lock file
  _updatelock() {
    fs.writeFileSync(
      this.lockfile,
      JSON.stringify(this.cachedMap, null, 2),
      'utf8',
    );
  }

  async requestRemoteCache(
    name: string,
    version: string,
    virtualDependenciesMap: Record<string, string>,
    pdnHost: string,
  ): Promise<CacheItem | false> {
    let normalized = '';

    name = name.trim();

    version = version.trim();

    // deps that can't convert to esm format
    if (virtualDependenciesMap[name]) {
      const file = this.set(name, version, virtualDependenciesMap[name], []);
      return {
        file,
        dependencies: [],
      };
    }

    if (name.includes('/')) {
      const paths: string[] = name.split('/').map(p => p.trim());
      if (name.startsWith('@')) {
        normalized = `${paths[0]}/${paths[1]}@${version}/${encodeURIComponent(
          paths.slice(2).join('/'),
        )}`;
      } else {
        normalized = `${paths[0]}@${version}/${encodeURIComponent(
          paths.slice(1).join('/'),
        )}`;
      }
    } else {
      normalized = `${name}@${version}`;
    }

    try {
      const res = await request(`esm/bv/${normalized}?meta`, pdnHost);

      if (typeof res !== 'object' || res.code !== 0 || !res.data) {
        return false;
      } else {
        const dependencies = (res.data.meta || []).map(
          dep => normalizeSemverSpecifierVersion(dep).name,
        );
        const file = this.set(name, version, res.data.content, dependencies);
        return {
          dependencies,
          file,
        };
      }
    } catch (err: any) {
      logger.error(
        `request http://${
          process.env.PDN_HOST || pdnHost
        }${`/esm/bv/${normalized}?meta`} error: ${err.message}`,
      );
      throw err;
    }
  }
}
