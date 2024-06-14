export interface StoragePresetConfig {
  id?: string;
  name: string;
  cookie?: Record<string, string>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
}

export interface StoragePresetWithIdent extends StoragePresetConfig {
  id: string;
}

export interface StoragePresetContext extends StoragePresetWithIdent {
  filename: string;
}
