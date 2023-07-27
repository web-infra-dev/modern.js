import { SSRServerContext } from './types';

export type SSRReporter = ReturnType<typeof createSSRReporter>;

export function createSSRReporter(reporter: SSRServerContext['reporter']) {
  const _reporter = {
    get sessionId() {
      return reporter.sessionId;
    },
    get userId() {
      return reporter.userId;
    },
    reportError(content: string, e: Error) {
      reporter.reportError(`SSR Error - ${content}`, e);
    },
    reportTime(name: string, cost: number) {
      reporter.reportTiming(`ssr_${name}`, cost);
    },
  };
  return _reporter;
}
