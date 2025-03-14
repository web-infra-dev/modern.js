import type { Context, Next } from 'hono';

export const hook = (
  attacher: (c: Context, next: Next) => void | Promise<void>,
) => attacher;
