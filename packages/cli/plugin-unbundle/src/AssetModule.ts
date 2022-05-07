import path from 'path';
import { cleanUrl } from './utils';

export const idToModules = new Map<string, AssetModule>();
export const fileToModules = new Map<string, AssetModule>();
export const urlToModules = new Map<string, AssetModule>();

export class AssetModule {
  // cleaned url
  url: string;

  // url with query or hash
  rawUrl: string;

  // resolved id from url
  _id: string;

  // absolute fs file path
  _filePath: string;

  // dependency's id
  dependencies: Set<string>;

  // dependent's id
  dependents: Set<string>;

  // import.hot.accept(deps, () => {}), deps id
  acceptIds: Set<string>;

  // import.hot.accept(() => {})
  selfAccepted: boolean;

  transformed: string | null;

  hmrTimestamp: number;

  etag: string;

  type: string;

  constructor(url: string) {
    this.rawUrl = url;
    this.url = cleanUrl(url);

    urlToModules.set(this.url, this);

    this._id = '';
    this._filePath = '';
    this.acceptIds = new Set<string>();
    this.dependencies = new Set<string>();
    this.dependents = new Set<string>();
    this.selfAccepted = false;
    this.transformed = null;
    this.hmrTimestamp = 0;
    this.etag = '';
    this.type = '';
  }

  get filePath() {
    return this._filePath;
  }

  set filePath(file: string) {
    this._filePath = file;
    this.type = path.extname(this._filePath);
    if (!fileToModules.has(file)) {
      fileToModules.set(file, this);
    }
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
    if (!idToModules.has(id)) {
      idToModules.set(id, this);
    }
  }

  update() {
    // TODO
  }
}

export const createAssetModule = (url: string): AssetModule => {
  const existing = urlToModules.get(cleanUrl(url));

  if (existing) {
    return existing;
  }

  return new AssetModule(url);
};

// invalidate transform cache
// mark as been hmr update by timestamp
export const invalidateAssetModule = (
  assetModule: AssetModule,
  timestamp: number,
) => {
  assetModule.hmrTimestamp = timestamp;
  assetModule.transformed = null;
};
