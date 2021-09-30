import * as glob from 'glob';
import { chalk } from '@modern-js/utils';

interface ValidOption {
  stories: string[];
}

export const valid = ({ stories }: ValidOption) => {
  let files: string[] = [];
  for (const s of stories) {
    files = [...files, ...glob.sync(s)];
  }
  if (files.length <= 0) {
    console.info(
      chalk.yellow(
        'No stories found, create directory "./stories" and add story',
      ),
    );
    return false;
  }

  return true;
};
