import fs from 'fs';
import { transform, Config } from '@svgr/core';
import { createFilter, CreateFilter } from 'rollup-pluginutils';
import svgo from '@svgr/plugin-svgo';
import jsx from '@svgr/plugin-jsx';
import type { LibuildPlugin } from '@modern-js/libuild';

export interface Options extends Config {
  include?: Parameters<CreateFilter>[0];
  exclude?: Parameters<CreateFilter>[1];
}

const PLUGIN_NAME = 'libuild:svgr';
const SVG_REGEXP = /\.svg$/;

export const svgrPlugin = (options: Options = {}): LibuildPlugin => {
  const filter = createFilter(options.include || SVG_REGEXP, options.exclude);
  return {
    name: PLUGIN_NAME,
    apply(compiler) {
      compiler.loadSvgr = async (path: string) => {
        if (!filter(path)) return;
        const loader = 'jsx';
        const text = fs.readFileSync(path.split('?')[0], 'utf8');
        const jsCode = await transform(text, options, {
          filePath: path,
          caller: {
            name: PLUGIN_NAME,
            defaultPlugins: [svgo, jsx],
          },
        });
        return {
          contents: jsCode,
          loader,
        };
      };
      compiler.hooks.load.tapPromise(PLUGIN_NAME, async (args) => {
        const result = await compiler.loadSvgr(args.path);
        return result;
      });
    },
  };
};
