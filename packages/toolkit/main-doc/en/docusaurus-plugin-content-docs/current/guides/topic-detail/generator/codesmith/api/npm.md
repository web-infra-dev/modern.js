---
sidebar_position: 7
---

# @modern-js/codesmith-api-npm

The NPM API encapsulation in the microgenerator provides a common method for installing dependencies of different NPM package management tools.

## Use

```ts
import { NpmAPI } from '@modern-js/codesmith-api-npm';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const npmApi = new NpmAPI(generator);
  await npmApi.pnpmInstall();
};
```

- Create NpmAPI instance, the parameter is the generator of the microgenerator function parameter, please see the composition of the microgenerator project for details.

- Just call the API on its example.

## API

### npmInstall

Install dependency using npm.

Parameter:

- cwd?: `string`. The execution directory of the install command, the default is microgenerator `outputPath`.

### yarnInstall

Install dependency using yarn.

Parameter:

- cwd?: `string`. The execution directory of the install command, the default is microgenerator `outputPath`.

### pnpmInstall

Install dependency using pnpm.

Parameter:

- cwd?: `string`. The execution directory of the install command, the default is microgenerator `outputPath`.
