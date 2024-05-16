import { StoragePresetWithIdent } from '@modern-js/devtools-kit/runtime';
import _ from 'lodash';

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

export interface UnwindPreset {
  id: string;
  name: string;
  filename: string;
  items: UnwindStorageRecord[];
}
