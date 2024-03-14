import type { CookieSerializeOptions } from 'cookie-es';

export interface LocalStoragePresetItem {
  type: 'local-storage';
  key: string;
  value: string | object | number;
}

export interface SessionStoragePresetItem {
  type: 'session-storage';
  key: string;
  value: string | object | number;
}

export interface CookiePresetItem
  extends Omit<CookieSerializeOptions, 'encode'> {
  type: 'cookie';
  key: string;
  value: string | object | number;
}

export type StoragePreset =
  | LocalStoragePresetItem
  | SessionStoragePresetItem
  | CookiePresetItem;

export interface StoragePresetOptions {
  name: string;
  items: StoragePreset[];
}
