import { useLoaderData } from '@modern-js/runtime/router';
import { ReportHeading, ReportMethod } from './ReportStatic';
import ReportContent from './ReportContent';
import type { loader } from './page.data';
export default function WeatherReport() {
  const { endpoint, report } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;
  return (
    <ReportContent
      endpoint={endpoint}
      initialReport={report}
      heading={<ReportHeading />}
      method={<ReportMethod />}
    />
  );
}
