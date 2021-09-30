import { init, parse } from 'es-module-lexer';
import { Result, Ok, Err } from './result';

export type Handlers = string[];

export type ExportsCheckResult = Result<Handlers>;

export const checkSource = async (
  source: string,
): Promise<ExportsCheckResult> => {
  await init;

  const [, exports] = parse(source);

  const handlers: Handlers = [];

  if (exports.length === 0) {
    return Err('Without any export item, Expect one at least');
  }

  exports.forEach(item => {
    handlers.push(item);
  });

  return Ok(handlers);
};
