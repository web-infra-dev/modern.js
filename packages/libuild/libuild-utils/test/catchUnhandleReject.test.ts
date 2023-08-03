import { expect } from 'chai';
import { catchUnhandledReject } from '../src';

describe('catchUnhandledReject', () => {
  it('catch err', () => {
    catchUnhandledReject(
      new Promise(() => {
        const a = {};
        // @ts-ignore
        a.b();
      }),
      (err: any) => {
        expect(err instanceof Error).eq(true);
      }
    );
  });
});
