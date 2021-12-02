import path from 'path';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { GeneratorCore, GeneratorContext } from '@modern-js/codesmith';
import { fs } from '@modern-js/generator-utils';
import { PluginHandlebarsAPI } from './handlebars';
import {
  AddFileParams,
  AddManyFilesParams,
  addFile,
  addManyFiles,
  fileExists,
} from '@/utils/file';

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
  private readonly projectPath: string = '';

  private readonly templatePath: string = 'templates';

  private readonly handlebarAPI: PluginHandlebarsAPI =
    new PluginHandlebarsAPI();

  private readonly jsonAPI: JsonAPI;

  private readonly generatorContext: GeneratorContext;

  constructor(
    generator: GeneratorCore,
    context: GeneratorContext,
    projectPath: string,
  ) {
    this.projectPath = projectPath;
    this.jsonAPI = new JsonAPI(generator);
    this.generatorContext = context;
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
    await this.jsonAPI.update(
      this.generatorContext.materials.default.get(
        path.join(this.projectPath, fileName),
      ),
      {
        query: {},
        update: {
          $set: {
            ...updateInfo,
          },
        },
      },
    );
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
        await fs.rmdir(dir, {
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
