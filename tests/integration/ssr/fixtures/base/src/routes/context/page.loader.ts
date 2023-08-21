import { LoaderFunctionArgs, reporterCtx } from '@modern-js/runtime/router';

export interface LoaderData {
  reporter: string;
}

export default function ({ context }: LoaderFunctionArgs) {
  const reporter = context?.get(reporterCtx);

  return {
    reporter: `context.reporter:${typeof reporter}`,
  };
}
