import { GeneratorCore } from '@modern-js/codesmith';
import { Schema } from '@modern-js/easy-form-core';
import {
  ActionElement,
  ActionFunction,
  PackageManager,
  Solution,
  SubSolution,
} from '@modern-js/generator-common';
import { PluginFileAPI } from './file';
import { PluginGitAPI } from './git';
import { IInput, IOption, PluginInputContext } from './input';
import { PluginNpmAPI } from './npm';
import { PluginNewAPI } from './new';
import { AddFileParams, AddManyFilesParams } from '@/utils/file';

export interface IPluginContext {
  addInputBefore: (key: string, input: IInput) => void;
  addInputAfter: (key: string, input: IInput) => void;
  setInput: (key: string, field: string, value: unknown) => void;
  addOptionBefore: (key: string, optionKey: string, option: IOption) => void;
  addOptionAfter: (key: string, optionKey: string, option: IOption) => void;
  isFileExit: (fileName: string) => Promise<boolean>;
  readDir: (dir: string) => Promise<string[]>;
  setGitMessage: (gitMessage: string) => void;
  onForged: (func: PluginForgedFunc) => void;
  afterForged: (func: PluginAfterForgedFunc) => void;
}

export enum LifeCycle {
  OnForged = 'onForged',
  AfterForged = 'afterForged',
}

export type ForgedAPI = {
  addFile: (params: AddFileParams) => Promise<void>;
  addManyFiles: (params: AddManyFilesParams) => Promise<void>;
  updateJSONFile: (
    fileName: string,
    updateInfo: Record<string, unknown>,
  ) => Promise<void>;
  updateTextRawFile: (
    fileName: string,
    update: (content: string[]) => string[],
  ) => Promise<void>;
  rmFile: (fileName: string) => Promise<void>;
  rmDir: (dirName: string) => Promise<void>;
  addHelper: (name: string, fn: Handlebars.HelperDelegate) => void;
  addPartial: (name: string, str: Handlebars.Template) => void;
  createElement: (
    element: ActionElement,
    params: Record<string, unknown>,
  ) => Promise<void>;
  enableFunc: (
    func: ActionFunction,
    params?: Record<string, unknown> | undefined,
  ) => Promise<void>;
  createSubProject: (
    solution: SubSolution,
    params: Record<string, unknown>,
  ) => Promise<void>;
};

export type AfterForgedAPI = {
  isInGitRepo: () => Promise<boolean>;
  initGitRepo: () => Promise<void>;
  gitAddAndCommit: (commitMessage: string) => Promise<void>;
  install: () => Promise<void>;
};

type PluginForgedFunc = (
  api: ForgedAPI,
  inputData: Record<string, unknown>,
) => Promise<void>;

type PluginAfterForgedFunc = (
  api: AfterForgedAPI,
  inputData: Record<string, unknown>,
) => Promise<void>;

export class PluginContext {
  generator: GeneratorCore;

  inputContext: PluginInputContext;

  gitAPI: PluginGitAPI;

  fileAPI: PluginFileAPI;

  npmAPI: PluginNpmAPI;

  newAPI: PluginNewAPI;

  lifeCycleFuncMap: Record<LifeCycle, unknown> = {
    [LifeCycle.OnForged]: () => {
      /* empty */
    },
    [LifeCycle.AfterForged]: () => {
      /* empty */
    },
  };

  // eslint-disable-next-line max-params
  constructor(
    generator: GeneratorCore,
    solution: Solution | 'custom',
    projectPath: string,
    templatePath: string,
    inputData: Record<string, unknown>,
    inputs: Schema[],
  ) {
    this.generator = generator;
    this.inputContext = new PluginInputContext(inputs);
    this.gitAPI = new PluginGitAPI(generator, projectPath);
    this.fileAPI = new PluginFileAPI(generator, projectPath, templatePath);
    this.npmAPI = new PluginNpmAPI(
      projectPath,
      inputData.packageManager as PackageManager,
    );
    this.newAPI = new PluginNewAPI(solution, projectPath);
  }

  get context(): IPluginContext {
    return {
      ...this.inputContext.context,
      ...this.gitAPI.context,
      ...this.fileAPI.context,
      onForged: this.onForged.bind(this),
      afterForged: this.afterForged.bind(this),
    };
  }

  get forgedAPI(): ForgedAPI {
    return {
      ...this.fileAPI.method,
      ...this.newAPI.method,
    };
  }

  get afterForgedAPI(): AfterForgedAPI {
    return {
      ...this.gitAPI.method,
      ...this.npmAPI.method,
    };
  }

  onForged(func: PluginForgedFunc) {
    this.lifeCycleFuncMap[LifeCycle.OnForged] = func;
  }

  afterForged(func: PluginAfterForgedFunc) {
    this.lifeCycleFuncMap[LifeCycle.AfterForged] = func;
  }
}
