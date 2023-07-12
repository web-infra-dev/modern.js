import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import type { SidebarGroup } from '@modern-js/doc-core/src/shared/types/index';
import {
  getClassPath,
  getModulePath,
  getInterfacePath,
  getFunctionPath,
} from './utils';

interface ModuleItem {
  id: number;
  name: string;
  children: {
    id: number;
    name: string;
  }[];
  groups: {
    title: string;
    children: number[];
  }[];
}

export async function resolveSidebar(jsonDir: string): Promise<SidebarGroup[]> {
  const result: SidebarGroup[] = [];
  const data = JSON.parse(await fs.readFile(jsonDir, 'utf-8'));
  if (!data.children || data.children.length <= 0) {
    return result;
  }
  data.children.forEach((module: ModuleItem) => {
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
      const kindString = module.groups
        .find(item => item.children.includes(sub.id))
        ?.title.slice(0, -1);
      if (!kindString) {
        return;
      }
      switch (kindString) {
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
    result.push(moduleConfig);
  });
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
