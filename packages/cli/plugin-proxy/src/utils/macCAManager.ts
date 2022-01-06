import os from 'os';
import http from 'http';
import path from 'path';
import { fs, logger } from '@modern-js/utils';
import execSync from './execSync';

const defaultCertDir = path.resolve(os.homedir(), './.whistle-proxy');
export const defaultRootCA = path.resolve(defaultCertDir, './rootCA.crt');

export const trustRootCA = () => {
  logger.info(`please type the password to trust the https certificate`);
  const { status } = execSync(
    `sudo security add-trusted-cert -d -k /Library/Keychains/System.keychain ${defaultRootCA}`,
  );
  if (status === 0) {
    logger.info('Root CA install, you are ready to intercept the https now');
  } else {
    logger.info('Failed to trust the root CA, please trust it manually');
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isRootCATrusted = () => {
  // current empty
};

export const isRootCAExists = () => {
  if (fs.existsSync(defaultRootCA)) {
    return true;
  }
  return false;
};

export const generateRootCA = () =>
  new Promise((resolve, reject) => {
    if (fs.existsSync(defaultRootCA)) {
      fs.removeSync(defaultRootCA);
    }

    fs.ensureDirSync(defaultCertDir);
    const stream = fs.createWriteStream(defaultRootCA);

    http
      .get('http://127.0.0.1:8899/cgi-bin/rootca', response => {
        response.pipe(stream);
        stream
          .on('finish', () => {
            resolve(defaultRootCA);
          })
          .on('error', err => {
            reject(err);
          });
      })
      .on('error', err => {
        fs.unlink(defaultRootCA); // Delete the file
        reject(err);
      });
  });
