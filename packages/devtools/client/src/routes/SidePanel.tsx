import React from 'react';
import { useSnapshot } from 'valtio';
import { useNavigate } from '@modern-js/runtime/router';
import { useStore } from '@/stores';
import { useStoreMap } from '@/utils/hooks';
import { InternalTab } from '@/types';

interface SidePanelButtonProps {
  $tab: InternalTab;
}

const SidePanelButton: React.FC<SidePanelButtonProps> = ({ $tab }) => {
  const tab = useSnapshot($tab);
  const navigate = useNavigate();
  const { view } = tab;
  const handleClick = () => {
    if (view.type === 'builtin') {
      navigate(view.url);
    } else {
      throw new Error('Unimplemented.');
    }
  };
  return <button onClick={handleClick}>{tab.title}</button>;
};

const SidePanel: React.FC = () => {
  const $store = useStore();
  const tabPairs = useStoreMap($store.tabs, 'name');
  return (
    <div>
      {tabPairs.map(([key, $tab]) => (
        <SidePanelButton key={key} $tab={$tab} />
      ))}
    </div>
  );
};

export default SidePanel;
