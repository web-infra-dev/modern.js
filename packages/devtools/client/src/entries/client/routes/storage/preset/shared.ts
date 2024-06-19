import {
  StoragePresetContext,
  StoragePresetWithIdent,
} from '@modern-js/devtools-kit/runtime';
import _ from 'lodash';
import { $$globals } from '@/entries/client/globals';

export const STORAGE_TYPES = [
  'cookie',
  'localStorage',
  'sessionStorage',
] as const;
export const STORAGE_TYPE_PALETTE = {
  cookie: 'yellow',
  localStorage: 'green',
  sessionStorage: 'blue',
} as const;

export type StorageType = (typeof STORAGE_TYPES)[number];

export interface UnwindStorageRecord {
  id: string;
  key: string;
  value: string;
  type: StorageType;
}

export const unwindRecord = (
  preset: StoragePresetWithIdent,
  type: StorageType,
) =>
  _.map(preset[type], (value, key) => {
    const id = [preset.id, type, key].join('//');
    const ret: UnwindStorageRecord = { key, value, type, id };
    return ret;
  });

export const unwindPreset = (preset: StoragePresetWithIdent) => {
  const ret: UnwindStorageRecord[] = [];
  for (const type of STORAGE_TYPES) {
    ret.push(...unwindRecord(preset, type));
  }
  return ret;
};

export interface UnwindPreset extends StoragePresetContext {
  id: string;
  name: string;
  filename: string;
  items: UnwindStorageRecord[];
}

export interface StorageStatus {
  cookie: {
    client: Record<string, string>;
    server: Record<string, string>;
  };
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
}

export const applyStorage = async (
  storage?: Partial<Record<StorageType, Record<string, string>>>,
) => {
  const { mountPoint } = await $$globals;
  const [cookie, localStorage, sessionStorage] = await Promise.all([
    mountPoint.remote.cookies(storage?.cookie),
    mountPoint.remote.localStorage(storage?.localStorage),
    mountPoint.remote.sessionStorage(storage?.sessionStorage),
  ]);
  return { cookie, localStorage, sessionStorage };
};
