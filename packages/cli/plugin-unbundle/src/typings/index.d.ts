import '@modern-js/core';

declare module '@modern-js/core' {
  interface ServerConfig {
    https?: boolean;
  }

  interface OutputConfig {
    disableAutoImportStyle?: boolean;
  }

  interface DevConfig {
    unbundle?: {
      /**
       * Some package A may require another package B that is intended for Node.js
       * use only. In such a case, if package B cannot be converted to ESM, it will
       * cause package A to fail during unbundle development, even though package B
       * is not really required. Package B can thus be safely ignored via this option
       * to ensure transpilation of package A to ESM
       */
      ignore?: string | string[];
    };
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
