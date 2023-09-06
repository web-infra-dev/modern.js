export function getTailwindPath(appDirectory: string) {
  try {
    return require.resolve('tailwindcss', { paths: [appDirectory, __dirname] });
  } catch (err) {
    return 'tailwindcss';
  }
}

export function getTailwindVersion(appDirectory: string): '2' | '3' {
  try {
    const packageJsonPath = require.resolve('tailwindcss/package.json', {
      paths: [appDirectory, __dirname],
    });
    return require(packageJsonPath).version.split('.')[0];
  } catch (err) {
    return '3';
  }
}
