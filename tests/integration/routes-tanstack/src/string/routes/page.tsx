import { useMatch } from '@modern-js/runtime/tanstack-router';

export default function IndexPage() {
  const match = useMatch({ from: '/' });
  const page = match.loaderData!.page;

  return <div id="index">string-index:{page}</div>;
}
