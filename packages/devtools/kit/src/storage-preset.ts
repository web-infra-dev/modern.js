export interface StorageRecord {
  type: 'local-storage' | 'session-storage' | 'cookie';
  key: string;
  value: string | object | number;
}

export interface StoragePresetOptions {
  name: string;
  items: StorageRecord[];
}

export interface StoragePresetContext extends StoragePresetOptions {
  filename: string;
}
