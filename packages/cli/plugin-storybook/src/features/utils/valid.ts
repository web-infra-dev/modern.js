import { glob, chalk } from '@modern-js/utils';

interface ValidOption {
  stories: string[];
  isModuleTools: boolean;
  isTs: boolean;
}

export const valid = ({ stories, isModuleTools, isTs }: ValidOption) => {
  let files: string[] = [];
  for (const s of stories) {
    files = [...files, ...glob.sync(s)];
  }
  if (files.length <= 0) {
    console.info(
      chalk.yellow(
        isModuleTools
          ? `No stories found, create directory "./stories" and add *.stories.${
              isTs ? 'tsx' : 'jsx'
            } file`
          : `No stories found, please add *.stories.${
              isTs ? 'tsx' : 'jsx'
            } file`,
      ),
    );
    return false;
  }

  return true;
};
