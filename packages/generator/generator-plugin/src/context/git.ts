import { GitAPI } from '@modern-js/codesmith-api-git';
import { GeneratorCore } from '@modern-js/codesmith';

export class PluginGitAPI {
  gitMessage: string = '';

  private gitApi?: GitAPI;

  private projectPath?: string;

  get context() {
    return {
      setGitMessage: this.setGitMessage.bind(this),
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

  prepare(generator: GeneratorCore, projectPath: string) {
    this.gitApi = new GitAPI(generator);
    this.projectPath = projectPath;
  }

  async isInGitRepo() {
    return this.gitApi!.isInGitRepo(this.projectPath);
  }

  async initGitRepo() {
    await this.gitApi!.initGitRepo(this.projectPath);
  }

  async gitAddAndCommit(commitMessage = 'feat: init') {
    await this.gitApi!.addAndCommit(commitMessage, this.projectPath);
  }
}
