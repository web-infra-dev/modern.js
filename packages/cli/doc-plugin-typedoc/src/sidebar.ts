import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import type { SidebarGroup } from '@modern-js/doc-core/src/shared/types/index';
import { transformModuleName } from './utils';
import { ROUTE_PREFIX } from './constants';

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

async function patchLinks(outputDir: string) {
  // Patch links in markdown files
  // Scan all the markdown files in the output directory
  // replace [xxx](yyy) -> [xxx](./yyy)
  const normlizeLinksInFile = async (filePath: string) => {
    const content = await fs.readFile(filePath, 'utf-8');
    // replace: [xxx](yyy) -> [xxx](./yyy)
    const newContent = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, p1, p2) => {
        return `[${p1}](./${p2})`;
      },
    );
    await fs.writeFile(filePath, newContent);
  };

  const traverse = async (dir: string) => {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await traverse(filePath);
      } else if (stat.isFile() && /\.mdx?/.test(file)) {
        await normlizeLinksInFile(filePath);
      }
    }
  };
  await traverse(outputDir);
}

export async function resolveSidebarForSingleEntry(
  jsonFile: string,
): Promise<SidebarGroup[]> {
  const result: SidebarGroup[] = [];
  const data = JSON.parse(await fs.readFile(jsonFile, 'utf-8'));
  if (!data.children || data.children.length <= 0) {
    return [];
  }
  const symbolMap = new Map<string, number>();
  data.groups.forEach((group: { title: string; children: number[] }) => {
    const groupItem: SidebarGroup = {
      text: group.title,
      items: [],
    };
    group.children.forEach((id: number) => {
      const dataItem = data.children.find((item: ModuleItem) => item.id === id);
      if (dataItem) {
        // Note: we should handle the case that classes and interfaces have the same name
        // Such as class `Env` and variable `env`
        // The final output file name should be `classes/Env.md` and `variables/env-1.md`
        let fileName = dataItem.name;
        if (symbolMap.has(dataItem.name)) {
          const count = symbolMap.get(dataItem.name)! + 1;
          symbolMap.set(dataItem.name, count);
          fileName = `${dataItem.name}-${count}`;
        } else {
          symbolMap.set(dataItem.name.toLocaleLowerCase(), 0);
        }
        groupItem.items.push({
          text: dataItem.name,
          link: `${ROUTE_PREFIX}/${group.title.toLocaleLowerCase()}/${fileName}`,
        });
      }
    });
    result.push(groupItem);
  });

  await patchLinks(path.dirname(jsonFile));

  return result;
}

export async function resolveSidebarForMultiEntry(
  jsonFile: string,
): Promise<SidebarGroup[]> {
  const result: SidebarGroup[] = [];
  const data = JSON.parse(await fs.readFile(jsonFile, 'utf-8'));
  if (!data.children || data.children.length <= 0) {
    return result;
  }

  function getModulePath(name: string) {
    return path
      .join(`${ROUTE_PREFIX}/modules`, `${transformModuleName(name)}`)
      .replace(/\\/g, '/');
  }

  function getClassPath(moduleName: string, className: string) {
    return path
      .join(
        `${ROUTE_PREFIX}/classes`,
        `${transformModuleName(moduleName)}.${className}`,
      )
      .replace(/\\/g, '/');
  }

  function getInterfacePath(moduleName: string, interfaceName: string) {
    return path
      .join(
        `${ROUTE_PREFIX}/interfaces`,
        `${transformModuleName(moduleName)}.${interfaceName}`,
      )
      .replace(/\\/g, '/');
  }

  function getFunctionPath(moduleName: string, functionName: string) {
    return path
      .join(
        `${ROUTE_PREFIX}/functions`,
        `${transformModuleName(moduleName)}.${functionName}`,
      )
      .replace(/\\/g, '/');
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
  await patchLinks(path.dirname(jsonFile));
  return result;
}
