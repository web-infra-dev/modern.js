import Report from '../../rsc-probe/Page';

export const dynamic = 'force-dynamic';

export default function Page() {
  const endpoint = new URL('/climate-report', process.env.MF_LAB_API_ORIGIN);
  return (
    <main id="next-weather-fragment">
      <Report endpoint={endpoint.href} />
    </main>
  );
}
