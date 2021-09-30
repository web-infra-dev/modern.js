// 判断是否通过 ./、../的方式引用文件
export const isProjectFile = (filePath: string) => {
  const tests = [/^\.\//, /^\.\.\//];
  return tests.some(regex => regex.test(filePath));
};
