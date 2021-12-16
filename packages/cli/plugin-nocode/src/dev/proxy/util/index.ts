import fs from 'fs';
import path from 'path';

// const EXCLUDE_PATHS = ['plugin'];

export const readdir = async (root: string, pth: string) => {
  try {
    const files = {};

    const fromFolder = async (folder: string) => {
      const state = await stat(folder);
      if ((state as any).isDirectory()) {
        const folders = await doReaddir(folder);
        for (const dir of folders as string[]) {
          await fromFolder(path.resolve(folder, dir));
        }
      } else {
        files[folder.replace(root, '')] = await readFile(folder);
      }
    };

    await fromFolder(path.resolve(root, pth));

    return files;
  } catch (e: any) {
    console.error(e);
    return {
      msg: e.message,
    };
  }
};

const doReaddir = (pth: string) =>
  new Promise((resolve, reject) => {
    fs.readdir(pth, (err, dirs) => {
      if (err) {
        reject(err);
      } else {
        resolve(dirs);
      }
    });
  });

const stat = (pth: string) =>
  new Promise((resolve, reject) => {
    fs.stat(pth, (err, state) => {
      if (err) {
        reject(err);
      } else {
        resolve(state);
      }
    });
  });

const readFile = (pth: string) =>
  new Promise((resolve, reject) => {
    fs.readFile(pth, 'utf-8', (err, state) => {
      if (err) {
        reject(err);
      } else {
        resolve(state);
      }
    });
  });
