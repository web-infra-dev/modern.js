import { execa } from './compiled';

export async function canUseNpm() {
  try {
    await execa('npm', ['--version'], { env: process.env });
    return true;
  } catch (e) {
    return false;
  }
}

export async function canUseYarn() {
  try {
    await execa('yarn', ['--version'], { env: process.env });
    return true;
  } catch (e) {
    return false;
  }
}

export async function canUsePnpm() {
  try {
    await execa('pnpm', ['--version'], { env: process.env });
    return true;
  } catch (e) {
    return false;
  }
}
