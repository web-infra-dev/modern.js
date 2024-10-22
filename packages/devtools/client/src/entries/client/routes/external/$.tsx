import { useGlobals } from '@/entries/client/globals';
import type { ExternalTabView, Tab } from '@modern-js/devtools-kit/runtime';
import { Route, Routes } from '@modern-js/runtime/router';
import type { FC } from 'react';
import { useSnapshot } from 'valtio';

const Page: FC = () => {
  const { tabs } = useSnapshot(useGlobals());
  const externalTabs: (Tab & { view: ExternalTabView })[] = [];
  for (const tab of tabs) {
    // @ts-expect-error
    tab.view.type === 'external' && externalTabs.push(tab);
  }

  return (
    <Routes>
      {externalTabs.map(tab => (
        <Route key={tab.name} path={tab.name} Component={tab.view.component} />
      ))}
    </Routes>
  );
};

export default Page;
