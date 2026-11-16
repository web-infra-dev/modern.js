import { DeferredScriptOutputCoordinator as SharedCoordinator } from '@modern-js/render/html/stream';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';

export class DeferredScriptOutputCoordinator extends SharedCoordinator {
  constructor(emit: (chunk: string) => void) {
    super(emit, { identifierPrefix: SSR_HYDRATION_ID_PREFIX });
  }
}
