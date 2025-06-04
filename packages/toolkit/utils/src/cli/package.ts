import { execa } from '../compiled';

export async function getPnpmVersion() {
  const { stdout } = await execa('pnpm', ['--version']);
  return stdout;
}

export async function canUseNpm() {
  try {
    await execa('npm', ['--version'], { env: process.env });
    return true;
  } catch (e) {
    return false;
  }
}

export async function canUseYarn() {
  try {
    await execa('yarn', ['--version'], { env: process.env });
    return true;
  } catch (e) {
    return false;
  }
}

export async function canUsePnpm() {
  try {
    await execa('pnpm', ['--version'], { env: process.env });
    return true;
  } catch (e) {
    return false;
  }
}

export function removeModuleSyncFromExports(
  exports: Record<string, any>,
): Record<string, any> {
  if (typeof exports !== 'object' || exports === null) {
    return exports;
  }

  if (Array.isArray(exports)) {
    return exports.map(removeModuleSyncFromExports);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(exports)) {
    if (key === 'module-sync') {
      continue;
    }
    result[key] = removeModuleSyncFromExports(value);
  }
  return result;
}
