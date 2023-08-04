import path from 'path';

export default {
  input: {
    a: './a.js',
    b: path.resolve(__dirname, './b.js'),
  },
  outdir: 'config-path',
  entryNames: 'config-filename',
};
