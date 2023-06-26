import { inspect } from 'util';
import { transformError } from '../shared/utils';
import { Context, ContextInitiationOptions } from './context';
import { ParsedError } from './parse';

export const outputPrettyError = (
  error: Error,
  options: ContextInitiationOptions = {},
) => {
  const ctx = new Context(options);
  const parsed = new ParsedError(error, ctx);
  // TODO: transform recursively.
  const transformed = transformError(ctx.transformers, parsed);
  ctx.output(inspect(transformed), ctx.type);
};
