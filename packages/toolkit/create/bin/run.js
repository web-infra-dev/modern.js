#!/usr/bin/env node
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const pkgInfo = require(path.join(__dirname, '../package.json'));
const srcPath = pkgInfo['jsnext:source'];
const distPath = pkgInfo.main;
const project = path.join(__dirname, '../tsconfig.json');

let env = 'production';
if (fs.existsSync(project)) {
  env = 'development';
}
if (process.env.CODESMITH_ENV) {
  env = process.env.CODESMITH_ENV;
}

const entry = path.join(
  __dirname,
  `../${env === 'development' ? srcPath : distPath}`,
);

if (env === 'development') {
  // 在 ES Module 环境下，使用 tsx 来加载 TypeScript 文件
  try {
    const { register } = await import('tsx/esm/api');
    register({
      tsconfig: project,
    });
    await import(pathToFileURL(entry).href);
  } catch (error) {
    console.error('Error: Cannot load TypeScript file in development mode.');
    console.error('Please install tsx: pnpm add -D tsx');
    console.error('Or build the project: pnpm build');
    console.error(error);
    process.exit(1);
  }
} else {
  import(pathToFileURL(entry).href).catch(e => {
    console.error(e);
  });
}
