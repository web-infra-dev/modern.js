import { fetchReport } from './report-model';

export async function loader({ request }: { request: Request }) {
  const endpoint = `${process.env.MF_LAB_API}/climate-report`;
  return {
    endpoint,
    report: await fetchReport(endpoint, undefined, request.signal),
  };
}
