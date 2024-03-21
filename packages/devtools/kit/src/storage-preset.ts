export interface StoragePresetConfig {
  name: string;
  cookie?: Record<string, string>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
}

export interface StoragePresetContext extends StoragePresetConfig {
  filename: string;
}
