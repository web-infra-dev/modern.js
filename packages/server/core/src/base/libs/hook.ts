import { AfterMatchContext, AfterRenderContext } from '@modern-js/types';
import { HonoContext } from '../types';
import { createBaseHookContext } from './hook/base';
import { RouterAPI } from './hook/routerApi';
import { TemplateApi } from './hook/template';

export function createAfterMatchCtx(
  c: HonoContext,
  entryName: string,
): AfterMatchContext {
  const baseContext = createBaseHookContext(c);

  return {
    ...baseContext,
    router: new RouterAPI(entryName),
  };
}

export function createAfterRenderCtx(c: HonoContext): AfterRenderContext {
  const baseContext = createBaseHookContext(c);

  return {
    ...baseContext,
    template: new TemplateApi(c),
  };
}
