import { resolve } from 'path';
import {
  readdirSync,
  readFileSync,
  existsSync,
  writeFileSync,
  mkdirSync,
} from 'fs';

export const getStories = () => {
  const stories = [];
  let storyFiles = [];
  const cwd = process.cwd();
  const storyPath = resolve(cwd, 'stories');

  try {
    storyFiles = readdirSync(storyPath);
  } catch (err) {}

  storyFiles.forEach(story => {
    try {
      const content = readFileSync(resolve(storyPath, story), 'utf-8');
      stories.push(JSON.parse(content));
    } catch (err) {}
  });

  return stories;
};

export const saveAsStory = ({ name, data }) => {
  const cwd = process.cwd();
  const storyPath = resolve(cwd, 'stories');
  const storyFilePath = resolve(storyPath, `${name}.json`);
  const storyData = { name, data };

  if (!existsSync(storyPath)) {
    mkdirSync(storyPath);
  }

  writeFileSync(storyFilePath, JSON.stringify(storyData, null, 2), 'utf-8');

  return [storyData];
};
