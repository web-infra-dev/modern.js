import path from 'path';
import { fs } from '@modern-js/utils';

const { readdirSync, readFileSync } = fs;

const getCssFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/css')).filter(
    (filepath: string) => /\.css$/.test(filepath),
  );

const readCssFile = (appDir: string, filename: string) =>
  readFileSync(path.resolve(appDir, `dist/static/css/${filename}`), 'utf8');

export const supportEmitCssFile = (appDir: string) => {
  const cssFiles = getCssFiles(appDir);

  expect(cssFiles.length).toBe(1);
  expect(readCssFile(appDir, cssFiles[0])).toContain(
    '#header{width:10px;height:20px}',
  );
};
