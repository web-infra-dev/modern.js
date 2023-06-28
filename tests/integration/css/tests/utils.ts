import path from 'path';
import { fs, glob } from '@modern-js/utils';

export const fixtures = path.resolve(__dirname, '../fixtures');

const { readdirSync, readFileSync, copySync } = fs;

export const getCssFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/css')).filter(filepath =>
    /\.css$/.test(filepath),
  );

export const readCssFile = (appDir: string, filename: string) =>
  readFileSync(path.resolve(appDir, `dist/static/css/${filename}`), 'utf8');

export const copyModules = (appDir: string) => {
  copySync(
    path.resolve(appDir, '_node_modules'),
    path.resolve(appDir, 'node_modules'),
  );
};

export const getCssMaps = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/css')).filter(filepath =>
    /\.css\.map$/.test(filepath),
  );

export const getPreCssFiles = (appDir: string, ext: string) =>
  glob
    .sync(path.resolve(appDir, 'dist/**/*'))
    .filter(filepath => new RegExp(`\\.${ext}$`).test(filepath));
