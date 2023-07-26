import { ReportEventPayload, ReportLogPayload } from '@modern-js/types';
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
      reporter.reportTime(`ssr_${name}`, cost);
    },
    reportLog(payload: ReportLogPayload) {
      reporter.reportLog(payload);
    },
    reportEvent(payload: ReportEventPayload) {
      reporter.reportEvent(payload);
    },
  };
  return _reporter;
}
