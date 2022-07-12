import path from 'path';
import axios from 'axios';
import { fs, execa } from '@modern-js/utils';
import tar from 'tar-fs';
import gunzip from 'gunzip-maybe';

const NPM_REGISTRY_URL = 'http://registry.npmjs.org';

// https://github.com/axios/axios/issues/2654
axios.defaults.adapter = require('axios/lib/adapters/http');

const npmAxios = axios.create({
  baseURL: NPM_REGISTRY_URL,
  responseType: 'json',
  timeout: 10000,
});

export const preparePackage = async (
  workDir: string,
  name: string,
  version: string,
) => {
  const tarballURL = await getTarballURL(name, version);
  try {
    await downloadTarball(tarballURL, workDir);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.log('download tarball failed:', tarballURL, e.message);
    throw e;
  }
  const packageDir = path.resolve(workDir, 'package');
  const targetDir = path.resolve(workDir, `node_modules/${name}`);
  await fs.move(packageDir, targetDir, { overwrite: true });

  return workDir;
};

export const preparePackages = async (
  workDir: string,
  packages: Record<string, string>,
) => {
  for (const [k, v] of Object.entries(packages)) {
    await preparePackage(workDir, k, v);
  }
  return workDir;
};

export const getPackageMeta = async (name: string) => {
  try {
    const res = await npmAxios.get<PackageMetaData>(`/${name}`);
    return res.data;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('fetch package meta failed', name);
    throw e;
  }
};

export const getTarballURL = async (
  name: string,
  version: string,
): Promise<string> => {
  const metadata = await getPackageMeta(name);
  const versionInfo = metadata.versions[version];
  const ret = versionInfo?.dist.tarball;
  if (!ret) {
    throw new Error(`${name}@${version} does not available`);
  }
  return ret;
};

export const downloadTarball = async (tarball: string, destDir: string) => {
  const tarball$ = (
    await npmAxios.get(tarball, {
      responseType: 'stream',
      timeout: 60000,
    })
  ).data;

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, {
      recursive: true,
    });
  }

  await new Promise<void>((resolve, reject) => {
    const extract = tar.extract(destDir);
    extract.on('finish', () => resolve());
    extract.on('error', (e: unknown) => reject(e));

    tarball$.pipe(gunzip()).pipe(extract);
  });
};

export interface PackageMetaData {
  name: string;
  description?: string;
  'dist-tags': {
    latest: string;
    next?: string;
    [key: string]: string | undefined;
  };
  versions: {
    [version: string]: {
      name: string;
      description?: string;
      keywords: string[];
      version: string;
      main: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      dist: {
        shasum: string;
        size: number;
        /**
         * @example /react/-/react-17.0.0-rc.0.tgz
         */
        key: string;
        /**
         * @example https://registry.npmjs.org/react/-/react-17.0.0-rc.0.tgz
         */
        tarball: string;
      };
    };
  };
}

export const installPackage = async (
  workDir: string,
  name: string,
  version: string,
) => {
  try {
    await execa(
      'npm',
      ['install', `${name}@${version}`, `--registry=${NPM_REGISTRY_URL}`],
      {
        cwd: workDir,
      },
    );
  } catch (e) {
    throw new Error(`npm install ${name}@${version} failed`);
  }
};

export const installPackages = async (
  workDir: string,
  packages: Record<string, string>,
) => {
  for (const [k, v] of Object.entries(packages)) {
    await installPackage(workDir, k, v);
  }
};
