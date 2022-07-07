import { getReleaseInfo, getReleaseNoteLine, Commit } from '../src/commands';

describe('release note function test', () => {
  test('getReleaseInfo', () => {
    let commitObj: Commit = {
      id: '552d98d',
      type: 'feature',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
    };
    commitObj = getReleaseInfo(
      '552d98d--chore: update devcert version to 1.2.2 (#1222)--zhangsan',
      commitObj,
    );
    expect(commitObj.pullRequestId).toEqual('1222');
    expect(commitObj.author).toEqual('zhangsan');
  });
  test('getReleaseNoteLine', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: 'feature',
      pullRequestId: '1222',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
      author: 'zhangsan',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual('#1222 chore: update devcert version to 1.2.2\n');
  });
  test('getReleaseNoteLine with repository', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: 'feature',
      pullRequestId: '1222',
      repository: 'modern-js-dev/modern.js',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
      author: 'zhangsan',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual(
      '- [#1222](https://github.com/modern-js-dev/modern.js/pull/1222) chore: update devcert version to 1.2.2\n',
    );
  });
  test('getReleaseNoteLine without author', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: 'feature',
      pullRequestId: '1222',
      repository: 'modern-js-dev/modern.js',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual(
      '- [#1222](https://github.com/modern-js-dev/modern.js/pull/1222) chore: update devcert version to 1.2.2\n',
    );
  });
  test('getReleaseNoteLine without pullRequestId', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: 'feature',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual('chore: update devcert version to 1.2.2\n');
  });
  test('getReleaseNoteLine multi line', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: 'feature',
      pullRequestId: '1222',
      repository: 'modern-js-dev/modern.js',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary:
        'chore: update devcert version to 1.2.2\n\nchore: 更新 devcert 版本到 1.2.2',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual(
      '- [#1222](https://github.com/modern-js-dev/modern.js/pull/1222) \n\n  chore: update devcert version to 1.2.2\n\n  chore: 更新 devcert 版本到 1.2.2\n',
    );
  });
});
