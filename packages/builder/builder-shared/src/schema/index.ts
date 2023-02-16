import { fromZodError, z, ZodError } from '../zod';
import { logger } from '../logger';

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
    prefix: 'builder config validation error:',
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
    logger.error(err.message);
    logger.error(`error detail:\n${JSON.stringify(err.details, null, 2)}`);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
  return parsed.data;
};
