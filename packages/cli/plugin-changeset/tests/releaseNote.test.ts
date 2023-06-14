import {
  getReleaseInfo,
  getReleaseNoteLine,
  Commit,
  CommitType,
} from '../src/commands';

describe('release note function test', () => {
  test('getReleaseInfo', async () => {
    let commitObj: Commit = {
      id: '552d98d',
      type: CommitType.Features,
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
      summary_zh: 'chore: 更新 devcert 版本到 1.2.2',
    };
    commitObj = await getReleaseInfo(
      '552d98d--chore: update devcert version to 1.2.2 (#1222)--zhangsan',
      commitObj,
    );
    expect(commitObj.pullRequestId).toEqual('1222');
  });
  test('getReleaseNoteLine', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: CommitType.Features,
      pullRequestId: '1222',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
      summary_zh: 'chore: 更新 devcert 版本到 1.2.2',
      author: 'zhangsan',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual(
      '- chore: update devcert version to 1.2.2 by @zhangsan\n',
    );
  });
  test('getReleaseNoteLine with repository', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: CommitType.Features,
      pullRequestId: '1222',
      repository: 'web-infra-dev/modern.js',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
      summary_zh: 'chore: 更新 devcert 版本到 1.2.2',
      author: 'zhangsan',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual(
      '- chore: update devcert version to 1.2.2 by @zhangsan in https://github.com/web-infra-dev/modern.js/pull/1222\n',
    );
  });
  test('getReleaseNoteLine without author', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: CommitType.Features,
      pullRequestId: '1222',
      repository: 'web-infra-dev/modern.js',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
      summary_zh: 'chore: 更新 devcert 版本到 1.2.2',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual(
      '- chore: update devcert version to 1.2.2 in https://github.com/web-infra-dev/modern.js/pull/1222\n',
    );
  });
  test('getReleaseNoteLine without pullRequestId', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: CommitType.Features,
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
      summary_zh: 'chore: 更新 devcert 版本到 1.2.2',
    };
    const line = getReleaseNoteLine(commitObj);
    expect(line).toEqual('- chore: update devcert version to 1.2.2\n');
  });
  test('getReleaseNoteLine multi line', () => {
    const commitObj: Commit = {
      id: '552d98d',
      type: CommitType.Features,
      pullRequestId: '1222',
      repository: 'web-infra-dev/modern.js',
      message: 'chore: update devcert version to 1.2.2 (#1222)',
      summary: 'chore: update devcert version to 1.2.2',
      summary_zh: 'chore: 更新 devcert 版本到 1.2.2',
      author: 'zhangsan',
    };
    const line = getReleaseNoteLine(commitObj);
    const line2 = getReleaseNoteLine(commitObj, undefined, 'zh');
    expect(line).toEqual(
      '- chore: update devcert version to 1.2.2 by @zhangsan in https://github.com/web-infra-dev/modern.js/pull/1222\n',
    );
    expect(line2).toEqual(
      '- chore: 更新 devcert 版本到 1.2.2 由 @zhangsan 实现， 详情可查看 https://github.com/web-infra-dev/modern.js/pull/1222\n',
    );
  });
});
