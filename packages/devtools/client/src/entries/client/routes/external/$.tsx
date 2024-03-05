import { ExternalTabView, Tab } from '@modern-js/devtools-kit/runtime';
import { Route, Routes } from '@modern-js/runtime/router';
import React, { FC } from 'react';
import { useSnapshot } from 'valtio';
import { $tabs } from '../state';

const Page: FC = () => {
  const tabs = useSnapshot($tabs);
  const externalTabs: (Tab & { view: ExternalTabView })[] = [];
  for (const tab of tabs) {
    // @ts-expect-error
    tab.view.type === 'external' && externalTabs.push(tab);
  }

  return (
    <Routes>
      {externalTabs.map(tab => (
        <Route
          key={tab.name}
          path={tab.name}
          handle={{ breadcrumb: { title: tab.title } }}
          element={React.createElement(tab.view.component)}
        />
      ))}
    </Routes>
  );
};

export default Page;
