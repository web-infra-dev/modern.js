/* eslint-disable max-classes-per-file */
import type { ComponentType, ReactElement } from 'react';
import type { Entrypoint } from '@modern-js/types';
import logo from './logo';
import { FileSystemRoutes } from './server';
import type { Op } from './valtio';

export interface ClientFunctions {
  refresh: () => void;
  updateState: (state: Record<string, any>) => Promise<void>;
  applyStateOperations: (ops: Op[]) => Promise<void>;
  updateFileSystemRoutes: (param: {
    entrypoint: Entrypoint;
    routes: FileSystemRoutes;
  }) => void;
}

export class NameDefinition {
  formalName: string = 'Modern.js';

  casualName: string = 'modern.js';

  prefixName: string = '_modern_js';
}

export interface ShortenAlias {
  replace: string | RegExp;
  to: string;
}

export class PackageDefinition {
  appTools: string = '@modern-js/app-tools';
}

export class AssetDefinition {
  logo: string = logo;
}

export class AnnouncementDefinition {
  src: string =
    'https://raw.githubusercontent.com/web-infra-dev/modern.js/main/ANNOUNCEMENT.md';

  fallback: string = 'https://modernjs.dev/';
}

export class DoctorDefinition {
  home: string = 'https://rsdoctor.dev';

  quickStart: string = 'https://rsdoctor.dev/guide/start/quick-start';
}

export class ClientDefinition {
  name: NameDefinition = new NameDefinition();

  packages: PackageDefinition = new PackageDefinition();

  assets: AssetDefinition = new AssetDefinition();

  doctor: DoctorDefinition = new DoctorDefinition();

  announcement: AnnouncementDefinition = new AnnouncementDefinition();

  plugins: string[] = [];
}

export interface IframeTabView {
  type: 'iframe';
  src: string;
}

export interface BuiltinTabView {
  type: 'builtin';
  src: string;
}

export interface ExternalTabView {
  type: 'external';
  component: ComponentType;
}

export interface Tab {
  name: string;
  title: string;
  view: BuiltinTabView | ExternalTabView | IframeTabView;
  icon?: string | ReactElement;
}
