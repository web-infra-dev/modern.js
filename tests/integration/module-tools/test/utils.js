const { globby, slash } = require('@modern-js/utils');

const getFolderList = async (target, globbyOpts = {}) => {
  const ret = await globby(target, {
    cwd: target,
    onlyDirectories: true,
    ...globbyOpts,
  });
  return ret.map(s => slash(s));
};

const getFilesList = async (target, globbyOpts = {}) => {
  const ret = await globby(target, {
    cwd: target,
    ...globbyOpts,
  });
  return ret.map(s => slash(s));
};

module.exports = {
  getFolderList,
  getFilesList,
};
