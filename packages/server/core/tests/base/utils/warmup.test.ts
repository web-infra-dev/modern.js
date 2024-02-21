import { warmup } from '@base/utils';

describe('test utils.warmup', () => {
  it('Should run correctly when import files is not exists', () => {
    warmup(['abc']);
  });
});
