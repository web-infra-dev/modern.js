import type CleanCss from 'clean-css';
import type { AcceptedPlugin, ProcessOptions, Plugin } from 'postcss';
import type { Options as sassOptions } from 'sass';

type LocalsConventionFunction = (originalClassName: string, generatedClassName: string, inputFile: string) => string;

type GenerateScopedNameFunction = (name: string, filename: string, css: string) => string;

declare class Loader {
  constructor(root: string, plugins: Plugin[]);

  fetch(file: string, relativeTo: string, depTrace: string): Promise<{ [key: string]: string }>;

  finalSource?: string | undefined;
}

export type PostcssOptions = {
  processOptions?: ProcessOptions;
  plugins?: AcceptedPlugin[];
};

export type { sassOptions };

type AdditionalData = string | ((filePath: string) => string);

export interface Style {
  inject?: boolean;
  sass?: {
    additionalData?: AdditionalData;
    implementation?: object | string;
    sassOptions?: sassOptions;
  };
  less?: {
    additionalData?: AdditionalData;
    implementation?: object | string;
    lessOptions?: Less.Options;
  };
  postcss?: PostcssOptions;
  autoModules?: boolean | RegExp;
  modules?: {
    localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly' | LocalsConventionFunction;
    scopeBehaviour?: 'global' | 'local';
    globalModulePaths?: RegExp[];
    generateScopedName?: string | GenerateScopedNameFunction;
    hashPrefix?: string;
    exportGlobals?: boolean;
    root?: string;
    resolve?: (file: string) => string | Promise<string>;
    Loader?: typeof Loader;
    getJSON?(cssFilename: string, json: { [name: string]: string }, outputFilename?: string): void;
  };
  cleanCss?: CleanCss.OptionsOutput | boolean;
}
