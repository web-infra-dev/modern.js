import { NormalizedConfig, IAppContext } from '@modern-js/core';
import webpack, { Asset } from 'webpack';
import { ROUTE_SPEC_FILE } from '@modern-js/utils';
import type { ServerRoute } from '@modern-js/types';

export class RouteManifest {
  name: string;

  appContext: IAppContext;

  options: NormalizedConfig;

  constructor({
    appContext,
    options,
  }: {
    appContext: IAppContext;
    options: NormalizedConfig;
  }) {
    this.name = 'routes-manifest';
    this.appContext = appContext;
    this.options = options;
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(
      this.name,
      (compilation: webpack.Compilation) => {
        const { Compilation } = compiler.webpack;

        compilation.hooks.processAssets.tap(
          {
            name: this.name,
            stage: Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
          },
          () => {
            const { serverRoutes } = this.appContext as IAppContext & {
              serverRoutes: ServerRoute[];
            };

            const output = JSON.stringify({ routes: serverRoutes }, null, 2);

            compilation.assets[ROUTE_SPEC_FILE] = {
              source() {
                return output;
              },
              size() {
                return output.length;
              },
            } as Asset['source'];
          },
        );
      },
    );
  }
}
