import path from 'path';
import { readdirSync } from 'fs';

export const fixtures = path.resolve(__dirname, '../fixtures');

export const getJsFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/js')).filter(filepath =>
    /\.js$/.test(filepath),
  );
