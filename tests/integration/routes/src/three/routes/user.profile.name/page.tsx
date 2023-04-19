import { useMatches } from '@modern-js/runtime/router';

export default function Page() {
  const matches = useMatches();

  const renderCrumbs = () => {
    const crumbs = matches.map(item => (item.handle as any).crumbs);
    return crumbs.join('/');
  };

  return (
    <div>
      profile name page<div>{renderCrumbs()}</div>
    </div>
  );
}
