import path from 'path';
import * as glob from 'glob';
import { chalk, fs } from '@modern-js/utils';

interface ValidOption {
  appDirectory: string;
  docsDir: string;
}

export const valid = ({ appDirectory, docsDir }: ValidOption) => {
  const docsAbsPath = path.join(appDirectory, docsDir);
  const files: string[] = glob.sync(`${docsAbsPath}/**/*.{md,mdx}`);
  if (!fs.existsSync(docsAbsPath) || files.length <= 0) {
    console.info(
      chalk.yellow(
        'No docs found, create directory "./docs" and add md(x) files',
      ),
    );
    return false;
  }

  return true;
};
