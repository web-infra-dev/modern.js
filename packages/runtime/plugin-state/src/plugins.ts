import autoActionsPlugin from '@modern-js-reduck/plugin-auto-actions';
import { plugin as effectsPlugin } from '@modern-js-reduck/plugin-effects';
import immerPlugin from '@modern-js-reduck/plugin-immutable';

export { default as devtools } from '@modern-js-reduck/plugin-devtools';

export const effects = () => effectsPlugin;
export const immer = () => immerPlugin;
export const autoActions = () => autoActionsPlugin;
