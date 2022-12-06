import type { AttributifyAttributes } from '@unocss/preset-attributify';

declare module 'react' {
  // Global html attributes in unocss
  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> extends AttributifyAttributes {}
}
