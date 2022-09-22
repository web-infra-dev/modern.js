import { RuntimeContext } from '../../core';
import { ModernSSRReactComponent } from '../serverRender/type';
import { createTemplates } from './template';
import renderToPipe from './renderToPipe';

export const render = async (
  context: RuntimeContext,
  App: ModernSSRReactComponent,
) => {
  const { beforeEach, afterEntry, afterLeave } = await createTemplates(
    context,
    App,
  );
  const before = beforeEach;
  const after = `${afterEntry || ''}${afterLeave || ''}`;
  const serverResponse = context.ssrContext?.response.raw;
  if (!serverResponse) {
    throw new Error('has not serverReponse');
  }
  const { pipe } = renderToPipe(App, {
    beforeEach: before,
    afterEntry: after,
  });
  pipe(serverResponse);
};
