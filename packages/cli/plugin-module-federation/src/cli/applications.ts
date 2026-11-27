import fs from 'node:fs';
import path from 'node:path';
import type { ApplicationsOptions, PluginOptions } from '../types';

const HOOK_EXTENSIONS = ['', '.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'];

export interface ResolvedApplicationsSetup {
  enabled: boolean;
  hooksPath?: string;
  autoGenerateRoute: boolean;
  maxDepth?: number;
  timeoutMs?: number;
}

export function resolveApplicationsOptions(
  applications: PluginOptions['applications'],
  appDirectory: string,
): ResolvedApplicationsSetup {
  if (!applications) {
    return { enabled: false, autoGenerateRoute: true };
  }
  const opts: ApplicationsOptions =
    typeof applications === 'object' ? applications : {};
  let hooksPath: string | undefined;
  if (opts.hooks) {
    const base = path.resolve(appDirectory, opts.hooks);
    const matched = HOOK_EXTENSIONS.map(ext => `${base}${ext}`).find(
      candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    );
    if (!matched) {
      throw new Error(
        `[Modern.js Module Federation] Applications hooks module not found: ${base}`,
      );
    }
    hooksPath = matched;
  }
  return {
    enabled: true,
    hooksPath,
    autoGenerateRoute: opts.autoGenerateRoute ?? true,
    maxDepth: opts.maxDepth,
    timeoutMs: opts.timeoutMs,
  };
}

export function writeApplicationsRuntimePlugin(options: {
  appDirectory: string;
  internalDirectory?: string;
  metaName: string;
  hooksPath?: string;
}): string {
  const dir =
    options.internalDirectory ||
    path.join(options.appDirectory, 'node_modules', '.modern-js');
  const filePath = path.join(dir, 'mf-applications-plugin.mjs');
  const mfImport = `@${options.metaName}/runtime/mf`;
  const normalizedHooks = options.hooksPath?.replace(/\\/g, '/');
  const content = normalizedHooks
    ? `import * as hooks from ${JSON.stringify(normalizedHooks)};\nimport { mfApplicationsPlugin as createApplicationsPlugin } from ${JSON.stringify(mfImport)};\n\nexport const mfApplicationsPlugin = (config = {}) =>\n  createApplicationsPlugin({ ...config, hooks });\n`
    : `import { mfApplicationsPlugin as createApplicationsPlugin } from ${JSON.stringify(mfImport)};\n\nexport const mfApplicationsPlugin = (config = {}) =>\n  createApplicationsPlugin(config);\n`;

  fs.mkdirSync(dir, { recursive: true });
  if (
    !fs.existsSync(filePath) ||
    fs.readFileSync(filePath, 'utf8') !== content
  ) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  return filePath;
}
