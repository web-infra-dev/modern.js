if (typeof window !== 'undefined') {
  const target = window as typeof window & { noDataLoads?: number };
  target.noDataLoads = (target.noDataLoads || 0) + 1;
}
export default function NoData() {
  return (
    <p data-testid="no-data">
      ☂ Weather tip: bring an umbrella. This local card has no data loader.
    </p>
  );
}
