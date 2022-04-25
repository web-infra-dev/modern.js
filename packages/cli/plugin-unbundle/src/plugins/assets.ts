import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { Plugin as RollupPlugin } from 'rollup';
import { mime } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import jsxPlugin from '@svgr/plugin-jsx';
import { ASSETS_REGEX } from '../constants';

const ENCODING_FORMAT = 'base64';

// should inline asset to base64 encode
const shouldInline = (limit: number | undefined, size: number) => {
  if (typeof limit === 'undefined') {
    return false;
  }

  if (typeof limit === 'number') {
    return size <= limit;
  }

  return true;
};

// svgr
export const transformSvg = (
  code: string,
  transformed: string,
  filePath: string,
) =>
  require('@svgr/core').default(
    code,
    { titleProp: true },
    {
      caller: {
        name: '@modern-js/plugin-unbundle',
        previousExport: transformed,
        defaultPlugins: [jsxPlugin.default || jsxPlugin],
      },
      filePath,
    },
  );

export const assetsPlugin = (
  config: NormalizedConfig,
  appContext: IAppContext,
): RollupPlugin => {
  const { appDirectory } = appContext;

  const {
    output: { dataUriLimit },
  } = config;

  return {
    name: 'esm-assets',
    async transform(code: string, importer: string) {
      if (!ASSETS_REGEX.test(importer)) {
        return;
      }

      let transformed = code;

      if (shouldInline(dataUriLimit, code.length)) {
        const content = fs.readFileSync(importer);
        let mimetype = mime.contentType(path.extname(importer));

        if (mimetype) {
          mimetype = mimetype.replace(/;\s+charset/i, ';charset');
        }

        const encodedData = `data:${
          mimetype || ''
        };${ENCODING_FORMAT},${Buffer.from(content).toString(
          ENCODING_FORMAT || undefined,
        )}`;

        transformed = `export default ${JSON.stringify(encodedData)}`;
      } else {
        const relativeUrl = path.relative(appDirectory, importer);
        transformed = `export default ${JSON.stringify(
          relativeUrl.startsWith('.') ? relativeUrl : `/${relativeUrl}`,
        )}`;
      }

      // apply svgr
      if (importer.endsWith('.svg')) {
        transformed = await transformSvg(code, transformed, importer);
      }

      return { code: transformed };
    },
  };
};
