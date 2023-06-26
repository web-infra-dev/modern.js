import path from 'path';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { getASTNodeImport } from '@/node/utils/getASTNodeImport';

/**
 * A remark plugin to import all builtin components.
 * @param options configure the global components.
 * @returns A unified transformer.
 */
export const remarkBuiltin: Plugin<[{ globalComponents: string[] }], Root> = ({
  globalComponents,
}) => {
  return tree => {
    const demos: MdxjsEsm[] = globalComponents.map(componentPath => {
      const filename = path.parse(componentPath).name;
      const componentName = filename[0].toUpperCase() + filename.slice(1);
      return getASTNodeImport(componentName, componentPath);
    });

    tree.children.unshift(...demos);
  };
};
