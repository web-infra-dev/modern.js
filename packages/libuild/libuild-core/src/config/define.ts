import { UserConfig } from '../types';

export function defineConfig(config: UserConfig): UserConfig;

export function defineConfig(config: UserConfig[]): UserConfig[];

export function defineConfig(config: UserConfig | UserConfig[]) {
  return config;
}
