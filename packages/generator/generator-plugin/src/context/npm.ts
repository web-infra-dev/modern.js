import { PackageManager } from '@modern-js/generator-common';
import {
  npmInstall,
  pnpmInstall,
  yarnInstall,
} from '@modern-js/codesmith-api-npm';

export class PluginNpmAPI {
  private readonly projectPath: string = '';

  private readonly packageManager: PackageManager;

  constructor(projectPath: string, packageManager: PackageManager) {
    this.projectPath = projectPath;
    this.packageManager = packageManager;
  }

  get method() {
    return { install: this.install.bind(this) };
  }

  async install() {
    if (this.packageManager === PackageManager.Pnpm) {
      await pnpmInstall(this.projectPath);
    } else if (this.packageManager === PackageManager.Yarn) {
      await yarnInstall(this.projectPath);
    } else {
      await npmInstall(this.projectPath);
    }
  }
}
