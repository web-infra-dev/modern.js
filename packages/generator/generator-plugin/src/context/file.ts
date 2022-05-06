import path from 'path';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { GeneratorCore, FsMaterial } from '@modern-js/codesmith';
import { fs } from '@modern-js/generator-utils';
import {
  AddFileParams,
  AddManyFilesParams,
  addFile,
  addManyFiles,
  fileExists,
} from '../utils/file';
import { PluginHandlebarsAPI } from './handlebars';

export enum FileType {
  Text = 'text',
  Binary = 'binary',
  Json = 'json',
  TextRaw = 'textRaw',
  // Ini = 'ini'
}

export interface IUpdateJSONFileParams {
  fileName: string;
  updateInfo: Record<string, any>;
}

export class PluginFileAPI {
  private projectPath: string = '';

  private templatePath: string = '';

  private readonly handlebarAPI: PluginHandlebarsAPI =
    new PluginHandlebarsAPI();

  private jsonAPI?: JsonAPI;

  constructor() {
    // 解决 renderString 使用 this 指向错误问题
    this.renderString = this.renderString.bind(this);
  }

  get context() {
    return {
      isFileExit: this.isFileExit.bind(this),
      readDir: this.readDir.bind(this),
    };
  }

  get method() {
    return {
      addFile: this.addFile.bind(this),
      addManyFiles: this.addManyFiles.bind(this),
      updateJSONFile: this.updateJSONFile.bind(this),
      updateModernConfig: this.updateModernConfig.bind(this),
      updateTextRawFile: this.updateTextRawFile.bind(this),
      rmFile: this.rmFile.bind(this),
      rmDir: this.rmDir.bind(this),
      addHelper: this.handlebarAPI.addHelper.bind(this),
      addPartial: this.handlebarAPI.addPartial.bind(this),
    };
  }

  renderString(template = '', data: Record<string, string> = {}) {
    return this.handlebarAPI.renderString(template, data);
  }

  prepare(generator: GeneratorCore, projectPath: string, templatePath: string) {
    this.projectPath = projectPath;
    this.jsonAPI = new JsonAPI(generator);
    this.templatePath = templatePath;
  }

  async addFile(params: AddFileParams) {
    await addFile(
      params,
      this.projectPath,
      this.templatePath,
      this.renderString,
    );
  }

  async addManyFiles(params: AddManyFilesParams) {
    await addManyFiles(
      params,
      this.projectPath,
      this.templatePath,
      this.renderString,
    );
  }

  async updateJSONFile(fileName: string, updateInfo: Record<string, any>) {
    const fsMaterial = new FsMaterial(this.projectPath);
    await this.jsonAPI!.update(fsMaterial.get(fileName), {
      query: {},
      update: {
        $set: {
          ...updateInfo,
        },
      },
    });
  }

  async updateModernConfig(updateInfo: Record<string, any>) {
    const update: Record<string, any> = {};
    Object.keys(updateInfo).forEach(key => {
      update[`modernConfig.${key}`] = updateInfo[key];
    });
    await this.updateJSONFile('package.json', update);
  }

  async updateTextRawFile(
    fileName: string,
    update: (content: string[]) => string[],
  ) {
    const content = await fs.readFile(
      path.join(this.projectPath, fileName),
      'utf-8',
    );
    const newContent = update(content.split('\n'));
    await fs.writeFile(
      path.join(this.projectPath, fileName),
      newContent.join('\n'),
      'utf-8',
    );
  }

  async rmFile(fileName: string) {
    const file = path.join(this.projectPath, fileName);
    if (await fileExists(file)) {
      await fs.rm(file);
    }
  }

  async rmDir(dirName: string) {
    const dir = path.join(this.projectPath, dirName);
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) {
        await fs.rm(dir, {
          recursive: true,
        });
      }
    } catch (e) {
      /** nothing */
    }
  }

  async isFileExit(fileName: string) {
    return fileExists(path.join(this.projectPath, fileName));
  }

  async readDir(dir: string) {
    return fs.readdir(path.join(this.projectPath, dir));
  }
}
