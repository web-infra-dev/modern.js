import { Plugin as RollupPlugin } from 'rollup';
import { fs } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';

export const jsonPlugin = (_config: NormalizedConfig): RollupPlugin => ({
  name: 'esm-json',
  load(id: string) {
    if (!id.endsWith('.json')) {
      return;
    }
    try {
      const json = fs.readJSONSync(id);
      return `export default ${JSON.stringify(json)}`;
    } catch (err: any) {
      err.loc = { file: id };
      throw err;
    }
  },
});
