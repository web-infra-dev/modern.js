import {
  ReportHeading,
  ReportMethod,
} from '../provider/src/routes/weather-application/report/ReportStatic';
import ReportContent from '../provider/src/routes/weather-application/report/ReportContent';
import { fetchReport } from '../provider/src/routes/weather-application/report/report-model';

export default async function Page({ endpoint }: { endpoint: string }) {
  const initialReport = await fetchReport(endpoint);
  return (
    <ReportContent
      endpoint={endpoint}
      initialReport={initialReport}
      heading={<ReportHeading />}
      method={<ReportMethod />}
    />
  );
}
