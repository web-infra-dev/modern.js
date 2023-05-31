---
sidebar_position: 3
---

# afterForged

`afterForged` is a lifecycle function used for other step operations after file operations in generator plugin.

## Types

```ts
export type AfterForgedAPI = {
  isInGitRepo: () => Promise<boolean>;
  initGitRepo: () => Promise<void>;
  gitAddAndCommit: (commitMessage: string) => Promise<void>;
  install: () => Promise<void>;
};

export type PluginAfterForgedFunc = (api: AfterForgedAPI, inputData: Record<string, unknown>) => Promise<void>;

export interface IPluginContext {
   afterForged: (func: PluginAfterForgedFunc) => void;
  ...
}
```

## API

The APIs provided by the `api` parameter will be introduced below.

### isInGitRepo

Checks whether the current project is a git repository.

### initGitRepo

Initializes the current project as a git repository.

### gitAddAndCommit

Commits changes to the current repository.

Parameters:

- `commitMessage`: commit message.

### install

Installs dependencies in the root directory of the project. The `install` function will use the corresponding package management tool according to the value of `packageManager` to install dependencies.
