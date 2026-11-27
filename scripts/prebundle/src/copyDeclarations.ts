import { isBuiltin } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import fs from 'fs-extra';
import ts from 'typescript';
import { copyLicense } from './helper';
import type { ParsedTask } from './types';

// Follow TypeScript's resolver for packages that use export maps, typesVersions,
// or declaration re-exports that dts-packer cannot follow.
export function copyDeclarations(task: ParsedTask) {
  function resolveDeclaration(name: string, from: string) {
    const result = ts.resolveModuleName(
      name,
      from,
      { moduleResolution: ts.ModuleResolutionKind.Node16 },
      ts.sys,
    ).resolvedModule;
    if (!result || !/\.d\.[cm]?ts$/.test(result.resolvedFileName)) {
      throw new Error(`Cannot resolve declaration for ${name} from ${from}`);
    }
    return result.resolvedFileName;
  }

  const entry = resolveDeclaration(task.depName, __filename);
  // TypeScript uses forward slashes, including on Windows.
  const installedPath = (file: string) => file.split('/node_modules/').pop()!;
  const packageName = (path: string) => path.match(/^(@[^/]+\/)?[^/]+/)![0];
  const root = packageName(installedPath(entry));
  const outputPath = (file: string) => {
    const path = installedPath(file);
    return packageName(path) === root
      ? join(task.distPath, path.slice(root.length + 1))
      : join(task.distPath, 'dependencies', path);
  };
  const visited = new Set<string>();
  const licenseSources = new Map<string, string>();

  function copy(file: string) {
    if (visited.has(file)) {
      return;
    }
    visited.add(file);
    const output = outputPath(file);
    const path = installedPath(file);
    const name = packageName(path);
    if (name !== task.depName) {
      licenseSources.set(
        name,
        file.slice(0, file.length - path.length + name.length),
      );
    }
    let content = fs.readFileSync(file, 'utf8');
    const { importedFiles, referencedFiles } = ts.preProcessFile(content);
    for (const reference of referencedFiles) {
      copy(ts.sys.resolvePath(join(dirname(file), reference.fileName)));
    }
    // Replace from the end so the scanner's offsets remain valid.
    for (const { fileName, pos, end } of importedFiles.reverse()) {
      if (isBuiltin(fileName)) {
        continue;
      }
      const dependency = resolveDeclaration(fileName, file);
      copy(dependency);
      if (!fileName.startsWith('.')) {
        const path = relative(dirname(output), outputPath(dependency))
          .split(sep)
          .join('/')
          .replace(/\.d\.([cm]?)ts$/, '.$1js');
        const specifier = path.startsWith('.') ? path : `./${path}`;
        content =
          content.slice(0, pos + 1) + specifier + content.slice(end + 1);
      }
    }
    fs.outputFileSync(
      output,
      content.replace(/^\/\/# sourceMappingURL=.*$/gm, ''),
    );
  }

  copy(entry);
  for (const [name, source] of licenseSources) {
    copyLicense(source, join(task.distPath, 'dependencies', name));
  }
}
