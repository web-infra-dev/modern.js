import type { ComponentType, ReactElement } from 'react';
import logo from './logo';
import type { Op } from './valtio';

export interface ClientFunctions {
  refresh: () => void;
  applyStateOperations: (ops: Op[]) => Promise<void>;
}

export class NameDefinition {
  formalName = 'Modern.js';

  casualName = 'modern.js';

  prefixName = '_modern_js';

  shortName = 'modern';
}

export interface ShortenAlias {
  replace: string | RegExp;
  to: string;
}

export class PackageDefinition {
  appTools = '@modern-js/app-tools';
}

export class AssetDefinition {
  logo: string = logo;
}

export class AnnouncementDefinition {
  src =
    'https://raw.githubusercontent.com/web-infra-dev/modern.js/main/ANNOUNCEMENT.md';

  fallback = 'https://modernjs.dev/';
}

export class DoctorDefinition {
  home = 'https://rsdoctor.dev';

  quickStart = 'https://rsdoctor.dev/guide/start/quick-start';
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
