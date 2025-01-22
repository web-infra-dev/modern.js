import type { Entrypoint } from '@modern-js/types';

export type AppendEntryCodeFn = (params: {
  entrypoint: Entrypoint;
  code: string;
}) => string | Promise<string>;
