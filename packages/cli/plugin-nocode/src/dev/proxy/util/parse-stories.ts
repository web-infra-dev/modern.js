import { resolve } from 'path';
import { fs } from '@modern-js/utils';

export const parseStories = () => {
  const cwd = process.cwd();
  const storyPath = resolve(cwd, 'stories');
  let content = '';

  // read index.jsx
  try {
    const storyFilePath = resolve(storyPath, `index.jsx`);
    content = fs.readFileSync(storyFilePath, 'utf-8');
  } catch (err) {}

  // if (index.jsx not exist) { read index.tsx }
  if (content === '') {
    try {
      const storyFilePath = resolve(storyPath, `index.tsx`);
      content = fs.readFileSync(storyFilePath, 'utf-8');
    } catch (err) {}
  }

  // try {
  //   const jsons = codeGen2.parseStory(content);

  //   for (const json of jsons) {
  //     const path = resolve(storyPath, `${json.name}.json`);
  //     fs.writeFileSync(path, JSON.stringify(json));
  //   }
  // } catch (err) {}
};
