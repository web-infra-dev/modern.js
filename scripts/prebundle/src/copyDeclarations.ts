import { isBuiltin } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import fs from 'fs-extra';
import ts from 'typescript';
import { copyLicense } from './helper';
import type { ParsedTask } from './types';

const normalizePath = (file: string) => file.replace(/\\/g, '/');

function resolveExternalSpecifier(
  specifier: string,
  output: string,
  distPath: string,
  externals: Record<string, string>,
) {
  let target = externals[specifier];
  if (!target) {
    for (const [pattern, replacement] of Object.entries(externals)) {
      if (
        pattern.length > 2 &&
        pattern.startsWith('/') &&
        pattern.endsWith('/')
      ) {
        const regex = new RegExp(pattern.slice(1, -1));
        if (regex.test(specifier)) {
          target = specifier.replace(regex, replacement);
          break;
        }
      }
    }
  }
  if (!target) {
    return undefined;
  }
  if (!target.startsWith('.')) {
    return target;
  }
  const rel = relative(dirname(output), join(distPath, target))
    .split(sep)
    .join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

// Follow TypeScript's resolver for packages that use export maps, typesVersions,
// or declaration re-exports that dts-packer cannot follow.
export function copyDeclarations(
  task: ParsedTask,
  externals: Record<string, string> = task.externals,
) {
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
    return normalizePath(result.resolvedFileName);
  }

  const entry = resolveDeclaration(task.depName, __filename);
  const installedPath = (file: string) => {
    const marker = '/node_modules/';
    const index = file.lastIndexOf(marker);
    if (index === -1) {
      throw new Error(`Declaration file is outside node_modules: ${file}`);
    }
    return file.slice(index + marker.length);
  };
  const packageName = (path: string) => path.match(/^(@[^/]+\/)?[^/]+/)![0];
  const entryInstalledPath = installedPath(entry);
  const root = packageName(entryInstalledPath);
  const outputPath = (file: string) => {
    const path = installedPath(file);
    return packageName(path) === root
      ? join(task.distPath, path.slice(root.length + 1))
      : join(task.distPath, 'dependencies', path);
  };
  const visited = new Set<string>();
  const writtenOutputs = new Map<string, string>();
  const licenseSources = new Map<string, string>();

  function copy(rawFile: string) {
    const file = normalizePath(rawFile);
    if (visited.has(file)) {
      return;
    }
    visited.add(file);
    const output = outputPath(file);
    const existingOutputSource = writtenOutputs.get(output);
    if (existingOutputSource && existingOutputSource !== file) {
      throw new Error(
        `Declaration output collision at ${output}: ${existingOutputSource} vs ${file}`,
      );
    }
    writtenOutputs.set(output, file);
    const path = installedPath(file);
    const name = packageName(path);
    if (name !== root) {
      const source = file.slice(0, file.length - path.length + name.length);
      const existingLicenseSource = licenseSources.get(name);
      if (existingLicenseSource && existingLicenseSource !== source) {
        throw new Error(
          `Declaration dependency version collision for ${name}: ${existingLicenseSource} vs ${source}`,
        );
      }
      licenseSources.set(name, source);
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
      if (!fileName.startsWith('.')) {
        const externalSpecifier = resolveExternalSpecifier(
          fileName,
          output,
          task.distPath,
          externals,
        );
        if (externalSpecifier) {
          content =
            content.slice(0, pos + 1) +
            externalSpecifier +
            content.slice(end + 1);
          continue;
        }
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

  return entryInstalledPath.slice(root.length + 1);
}
