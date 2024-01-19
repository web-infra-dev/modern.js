import { readFile } from 'fs/promises';
import path from 'path';
import { cutNameByHyphen } from '@modern-js/utils';
import { ServerRoute } from '@modern-js/types';
import { HonoRequest, Middleware } from '../types';
import { createSSRHandler } from './ssrHandler';

export interface CreateRenderHOptions {
  routeInfo: ServerRoute;
  distDir: string;
  metaName: string;

  // for use-loader api when ssg
  staticGenerate?: boolean;
  forceCSR?: boolean;
}

export async function createRenderHandler(
  options: CreateRenderHOptions,
): Promise<Middleware> {
  const {
    forceCSR,
    metaName,
    routeInfo,
    distDir,
    staticGenerate = false,
  } = options;

  const htmlPath = path.join(distDir, routeInfo.entryPath);
  const html = await readFile(htmlPath, 'utf-8');

  return async (c, _) => {
    const renderMode = getRenderMode(
      c.req,
      metaName,
      routeInfo.isSSR,
      forceCSR,
    );

    const handler =
      renderMode === 'csr'
        ? createCSRHandler(html)
        : await createSSRHandler({
            distDir,
            html,
            staticGenerate,
            mode: routeInfo.isStream ? 'stream' : 'string',
            routeInfo,
            metaName,
          });

    return handler(c, _);
  };
}

function createCSRHandler(html: string): Middleware {
  return async c => {
    return c.html(html);
  };
}

function getRenderMode(
  req: HonoRequest,
  framework: string,
  isSSR?: boolean,
  forceCSR?: boolean,
): 'ssr' | 'csr' {
  if (isSSR) {
    if (
      forceCSR &&
      (req.query('csr') ||
        req.header(`x-${cutNameByHyphen(framework)}-ssr-fallback`))
    ) {
      return 'csr';
    }
    return 'ssr';
  } else {
    return 'csr';
  }
}
