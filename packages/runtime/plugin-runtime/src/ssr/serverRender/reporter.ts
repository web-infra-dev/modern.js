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
      reporter.reportError(`SSR Error - ${content}`, 'SSR', e);
    },
    reportTime(name: string, cost: number) {
      reporter.reportTime(`ssr.${name}`, 'SSR', cost);
    },
    reportLog(payload: ReportLogPayload) {
      payload.extra = {
        ...(payload.extra || {}),
        type: 'SSR',
      };
      reporter.reportLog(payload);
    },
    reportEvent(payload: ReportEventPayload) {
      payload.categories = {
        ...(payload.categories || {}),
        type: 'SSR',
      };
      reporter.reportEvent(payload);
    },
  };
  return _reporter;
}
