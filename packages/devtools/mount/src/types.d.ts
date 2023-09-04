import { SetupClientOptions } from '@modern-js/devtools-kit';

export type Options = SetupClientOptions;

export type MountDevTools = (options?: Options) => void;

export declare const mountDevTools: MountDevTools;
