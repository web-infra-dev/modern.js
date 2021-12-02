import { GitAPI } from '@modern-js/codesmith-api-git';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';

export class PluginGitAPI {
  private readonly gitApi: GitAPI;

  constructor(generator: GeneratorCore, context: GeneratorContext) {
    this.gitApi = new GitAPI(generator, context);
  }

  async isInGitRepo() {
    return this.gitApi.isInGitRepo();
  }

  async initGitRepo() {
    await this.gitApi.initGitRepo();
  }

  async gitAddAndCommit(commitMessage: string) {
    await this.gitApi.addAndCommit(commitMessage);
  }
}
