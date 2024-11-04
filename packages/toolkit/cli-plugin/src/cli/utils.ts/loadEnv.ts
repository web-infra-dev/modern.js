import fs from 'fs';
import path from 'path';
import { dotenv, dotenvExpand } from '@modern-js/utils';

export const loadEnv = (
  appDirectory: string,
  mode: string = process.env.NODE_ENV as string,
) => {
  // Don't change the order of the filenames， since they are ordered by the priority.
  // Files on the left have more priority than files on the right.
  [`.env.${mode}.local`, '.env.local', `.env.${mode}`, '.env']
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
