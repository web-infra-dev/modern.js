import path from 'path';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { GeneratorCore, GeneratorContext } from '@modern-js/codesmith';
import { fs } from '@modern-js/generator-utils';
import { PluginHandlebarsContext } from './handlebars';
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

export class PluginFileContext {
  private readonly projectPath: string = '';

  private readonly templatePath: string = 'templates';

  private readonly handlebarContext: PluginHandlebarsContext =
    new PluginHandlebarsContext();

  private readonly jsonAPI: JsonAPI;

  private readonly context: GeneratorContext;

  constructor(
    generator: GeneratorCore,
    context: GeneratorContext,
    projectPath: string,
  ) {
    this.projectPath = projectPath;
    this.jsonAPI = new JsonAPI(generator);
    this.context = context;
  }

  renderString(template = '', data: Record<string, string> = {}) {
    return this.handlebarContext.renderString(template, data);
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
      this.context.materials.default.get(path.join(this.projectPath, fileName)),
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
}
