import path from 'path';
import { fs, createDebugger } from '@modern-js/utils';
import { Middleware } from 'koa';
import calculateEtag from 'etag';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import convertSourceMap from 'convert-source-map';
import { isCSSRequest, isJsRequest, isAssetRequest, cleanUrl } from '../utils';
import { PluginContainer } from '../plugins/container';
import { urlToModules, createAssetModule } from '../AssetModule';

const debug = createDebugger('esm:transform');

export const transformMiddleware = (
  config: NormalizedConfig,
  appContext: IAppContext,
  pluginContainer: PluginContainer,
): Middleware => {
  const { appDirectory } = appContext;

  return async (ctx, next) => {
    const { url, path: urlPath } = ctx;
    if (isJsRequest(url) || isCSSRequest(url) || isAssetRequest(url)) {
      // set content-type header
      ctx.type = 'application/javascript;charset=utf-8';

      let assetModule = urlToModules.get(cleanUrl(url));

      const ifNoneMatch = ctx.headers['if-none-match'];

      if (assetModule?.transformed) {
        if (ifNoneMatch && assetModule.etag === ifNoneMatch) {
          ctx.status = 304;
          ctx.body = '';
        } else {
          ctx.body = assetModule.transformed;
        }
        return;
      }

      const resolved = await pluginContainer.resolveId(urlPath);

      const filePath =
        typeof resolved === 'object' ? resolved?.id || urlPath : resolved;

      if (!filePath) {
        throw new Error(`Can't resolve ${urlPath}`);
      }

      debug(`resolved url ${url} to ${filePath || ''}`);

      assetModule = createAssetModule(url);
      assetModule.filePath = filePath;

      const relativeUrl = path.relative(appDirectory, filePath);

      assetModule.id = relativeUrl.startsWith('.')
        ? filePath
        : `/${relativeUrl}`;

      const result = filePath && (await pluginContainer.load(filePath));

      let code = typeof result === 'object' ? result?.code : result;

      if (!code) {
        code = fs.readFileSync(filePath, 'utf8');
      }

      // eslint-disable-next-line prefer-const
      let { code: transformed, map } = (await pluginContainer.transform(
        code,
        filePath,
      )) || { code };

      if (map) {
        const mapComment = convertSourceMap.fromObject(map).toComment();
        transformed = `${transformed}\n${mapComment}`;
      }

      const etag = calculateEtag(transformed || code);

      assetModule.transformed = transformed;
      assetModule.etag = etag;

      ctx.response.etag = etag;

      ctx.body = transformed;
    } else {
      return next();
    }
  };
};
