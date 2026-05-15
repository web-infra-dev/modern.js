import { useMatch } from '@modern-js/plugin-tanstack/runtime';

export default function IndexPage() {
  const match = useMatch({ from: '/' });
  const page = match.loaderData!.page;

  return <div id="index">stream-index:{page}</div>;
}
