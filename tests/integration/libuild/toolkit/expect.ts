import chai from 'chai';
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.use(jestSnapshotPlugin());

export const expect = chai.expect;
