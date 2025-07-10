import type { LoaderResult } from './page.data';

export default function MatchedPage({
  loaderData,
  matches,
}: {
  loaderData: LoaderResult;
  matches: any[];
}) {
  const lastMatch = matches[matches.length - 1];
  if (lastMatch.params.id !== loaderData.matchedId) {
    return <div>Not Matched</div>;
  }

  return <div className="matched">Matched</div>;
}
