/// <reference types="@modern-js-reduck/plugin-auto-actions" />
/// <reference types="@modern-js-reduck/plugin-devtools" />
/// <reference types="@modern-js-reduck/plugin-effects" />
/// <reference types="@modern-js-reduck/plugin-immutable" />

// eslint-disable-next-line filenames/match-exported
import statePlugin from './plugin';

export * from '@modern-js-reduck/react';
export { model } from '@modern-js-reduck/store';

export * from './plugin';

export default statePlugin;
