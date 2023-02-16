import { fromZodError, z, ZodError } from '../zod';
import chalk from '@modern-js/utils/chalk';

export * from './source';
export * from './dev';
export * from './html';
export * from './output';
export * from './experiments';
export * from './performance';
export * from './security';
export * from './tools';

export const formatZodError = (error: ZodError<unknown>) => {
  return fromZodError(error, {
    issueSeparator: '\n* ',
    prefix: `${chalk.red('Builder config validation error')}:`,
    prefixSeparator: '\n* ',
  });
};

export const validateBuilderConfig = async (
  configSchema: z.ZodType<unknown>,
  data: unknown,
) => {
  const parsed = await configSchema.safeParseAsync(data);
  if (!parsed.success) {
    const err = formatZodError(parsed.error);
    // only print message & details, error stack is useless
    const message = `${err.message}\nError detail:\n${JSON.stringify(
      err.details,
      null,
      2,
    )}`;

    throw new Error(message);
  }
  return parsed.data;
};
