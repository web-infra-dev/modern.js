declare module '@modern-js/runtime' {
  export const useModuleApp: typeof import('./dist/types/runtime').useModuleApp;
  export const useModuleApps: typeof import('./dist/types/runtime').useModuleApps;
  export const useLegacyModuleApps: typeof import('./dist/types/runtime').useLegacyModuleApps;
}
