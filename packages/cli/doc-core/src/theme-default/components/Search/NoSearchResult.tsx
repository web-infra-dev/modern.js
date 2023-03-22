import Empty from './empty.svg';

export function NoSearchResult({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center pt-8 pb-2">
      <Empty className="mb-4 opacity-80" />
      <p className="mb-2">
        No results for <b>&quot;{query}&quot;</b>.
      </p>
      <p>Please try again with a different keyword.</p>
    </div>
  );
}
