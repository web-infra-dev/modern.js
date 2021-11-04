import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

export const loadEnv = (
  appDirectory: string,
  mode: string = process.env.NODE_ENV as string,
) => {
  [`.env.${mode}`, '.env']
    .map(name => path.resolve(appDirectory, name))
    .filter(
      filePath =>
        fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory(),
    )
    .forEach(filePath => {
      const envConfig = dotenv.config({ path: filePath });

      dotenvExpand(envConfig);
    });
};
