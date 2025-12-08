export type ImportManifestEntry = {
  id: string | number;
  chunks: (string | number)[];
  styles?: string[];
  name: string;
};

export interface ClientReference {
  readonly id: string | number;
  readonly exportName: string;
  ssrId?: string | number;
}

export interface ClientManifest {
  [id: string]: ImportManifestEntry;
}

export interface ServerManifest {
  [id: string]: ImportManifestEntry;
}

export interface ServerReferencesModuleInfo {
  readonly exportNames: string[];
  moduleId?: string | number;
}

export type ClientReferencesMap = Map<string, ClientReference[]>;

export type ServerReferencesMap = Map<string, ServerReferencesModuleInfo>;

export type ModuleLoading = null | {
  prefix: string;
  crossOrigin?: 'use-credentials' | '';
};

export type SSRModuleMap = {
  [clientId: string]: {
    [clientExportName: string]: ImportManifestEntry;
  };
};

export type SSRManifest = {
  moduleMap: SSRModuleMap;
  moduleLoading: ModuleLoading;
  styles: string[];
};

export type ServerManifest = {
  [id: string]: ImportManifestEntry;
};

export type ClientManifest = {
  [id: string]: ImportManifestEntry;
};
