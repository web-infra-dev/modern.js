import { ActionFunction, LoaderFunctionArgs } from '@modern-js/runtime/router';
import { applyStorage } from './shared';

export const loader = async (_args: LoaderFunctionArgs) => {
  return await applyStorage();
};

export const action: ActionFunction = () => null;
