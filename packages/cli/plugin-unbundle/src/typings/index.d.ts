import '@modern-js/core';

declare module '@modern-js/core' {
  interface ServerConfig {
    https?: boolean;
  }

  interface OutputConfig {
    disableAutoImportStyle?: boolean;
  }
}

declare module 'acorn-class-fields';
declare module 'find-node-modules';
declare module '@svgr/core';
declare module '@svgr/plugin-jsx';
declare module 'launch-editor';
declare module 'merge-source-map';
declare module 'convert-source-map';
declare module 'node-fetch';
