import type { Compiler } from '@rspack/core';

const PLUGIN_NAME = 'ModuleFederationSSRPublicPathPlugin';

export class SSRPublicPathPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.additionalTreeRuntimeRequirements.tap(
        PLUGIN_NAME,
        (_chunk, requirements) => {
          // The MF Node runtime loads chunks over HTTP, unlike the native filesystem loader.
          requirements.add(compiler.webpack.RuntimeGlobals.publicPath);
        },
      );
    });
  }
}
