/// <reference types="@modern-js/app-tools/types/router" />
/// <reference types="@modern-js/runtime/types/router" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly MODERN_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
