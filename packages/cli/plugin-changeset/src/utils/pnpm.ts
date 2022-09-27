import execa from 'execa';

export async function getPnpmVersion() {
  const { stdout } = await execa('pnpm', ['--version']);
  return stdout;
}
