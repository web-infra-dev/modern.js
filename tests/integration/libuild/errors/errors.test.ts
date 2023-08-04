import fs from 'fs';
import path from 'path';
import { expect, getLibuilderTest } from '@/toolkit';

const PASS_PREFIX = '_';
const MSG_FILE_NAME = 'error.js';
const casesDirPath = __dirname;
const casesDir = fs
  .readdirSync(casesDirPath)
  .filter(
    (folder) => !folder.startsWith(PASS_PREFIX) && fs.lstatSync(path.resolve(casesDirPath, folder)).isDirectory()
  );

describe('errors', () => {
  casesDir.forEach((name) => {
    it(name, async () => {
      const caseDirPath = path.resolve(casesDirPath, name);
      const errMsgFilePath = path.resolve(caseDirPath, MSG_FILE_NAME);
      if (!fs.existsSync(errMsgFilePath)) {
        throw Error("The expected error.js can't be empty");
      }

      const errMsg: { msg: string } = require(errMsgFilePath);

      try {
        const bundler = await getLibuilderTest({
          root: caseDirPath,
        });
        await bundler.build();
      } catch (err: any) {
        const errString = err.toString();
        expect(errString.includes('Build failed with 1 error')).to.be.true;
        expect(errString.includes(errMsg.msg)).to.be.true;
        expect(err.errors.length).equal(1);
      }
    });
  });
});
