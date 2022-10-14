import { Schema } from '@modern-js/codesmith-formily';
import { getFrameworkSchema, Framework } from './common';

export const getServerSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: {
      framework: getFrameworkSchema(extra),
    },
  };
};

export const MWADefaultServerConfig = {
  framework: Framework.Express,
};
