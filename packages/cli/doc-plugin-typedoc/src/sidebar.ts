import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import {
  getClassPath,
  getModulePath,
  getInterfacePath,
  getFunctionPath,
} from './utils';

export async function resolveSidebar(jsonDir: string): Promise<any[]> {
  const result: any[] = [];
  const data = JSON.parse(await fs.readFile(jsonDir, 'utf-8'));
  if (!data.children || data.children.length <= 0) {
    return result;
  }
  data.children.forEach(
    (module: {
      name: string;
      children: {
        name: string;
        kindString: 'Class' | 'Interface' | 'Function';
      }[];
    }) => {
      const moduleNames = module.name.split('/');
      const name = moduleNames[moduleNames.length - 1];
      const moduleConfig = {
        text: `Module:${name}`,
        items: [{ text: 'Overview', link: getModulePath(module.name) }],
      };
      if (!module.children || module.children.length <= 0) {
        return;
      }
      module.children.forEach(sub => {
        switch (sub.kindString) {
          case 'Class':
            moduleConfig.items.push({
              text: `Class:${sub.name}`,
              link: getClassPath(module.name, sub.name),
            });
            break;
          case 'Interface':
            moduleConfig.items.push({
              text: `Interface:${sub.name}`,
              link: getInterfacePath(module.name, sub.name),
            });
            break;
          case 'Function':
            moduleConfig.items.push({
              text: `Function:${sub.name}`,
              link: getFunctionPath(module.name, sub.name),
            });
            break;
          default:
            break;
        }
      });
      result.push(moduleConfig as any);
    },
  );
  // Patch /api/README.md
  const readmeFile = path.join(path.dirname(jsonDir), 'README.md');
  const readme = await fs.readFile(readmeFile, 'utf-8');
  // replace: [xxx](yyy) -> [xxx](./yyy)
  const newReadme = readme.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, p1, p2) => {
      return `[${p1}](./${p2})`;
    },
  );

  await fs.writeFile(readmeFile, newReadme);

  return result;
}
