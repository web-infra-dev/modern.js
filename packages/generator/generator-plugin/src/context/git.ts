import { GitAPI } from '@modern-js/codesmith-api-git';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';

export class PluginGitAPI {
  gitMessage: string = 'feat: init';

  private readonly gitApi: GitAPI;

  constructor(generator: GeneratorCore, context: GeneratorContext) {
    this.gitApi = new GitAPI(generator, context);
  }

  get context() {
    return {
      setGitMessage: this.setGitMessage,
    };
  }

  get method() {
    return {
      isInGitRepo: this.isInGitRepo.bind(this),
      initGitRepo: this.initGitRepo.bind(this),
      gitAddAndCommit: this.gitAddAndCommit.bind(this),
    };
  }

  setGitMessage(gitMessage: string) {
    this.gitMessage = gitMessage;
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
