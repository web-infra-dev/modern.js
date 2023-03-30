import path from 'path';

export const getRspackVersion = async (): Promise<string> => {
  try {
    const core = require.resolve('@rspack/core');
    const pkg = await import(path.join(core, '../../package.json'));
    return pkg?.version;
  } catch (err) {
    // don't block build process
    console.error(err);
    return '';
  }
};
