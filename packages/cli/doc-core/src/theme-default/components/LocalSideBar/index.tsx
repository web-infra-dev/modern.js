import { Fragment, useState } from 'react';
import { SidebarGroup, SidebarItem } from 'shared/types';
import { SideBar } from '../Siderbar';
import styles from './index.module.scss';

interface Props {
  pathname: string;
  langRoutePrefix: string;
  sidebarData: (SidebarGroup | SidebarItem)[];
}

export function SideMenu(props: Props) {
  const { langRoutePrefix, pathname, sidebarData } = props;
  const [isSidebarOpen, setIsOpen] = useState<boolean>(false);
  function openSidebar() {
    setIsOpen(true);
  }

  function closeSidebar() {
    setIsOpen(false);
  }
  return (
    <Fragment>
      <div className={styles.localNav}>
        <button flex="center" onClick={openSidebar} className={styles.menu}>
          <div text="md" mr="2" className="i-carbon:menu"></div>
          <span text="md ">Menu</span>
        </button>
      </div>
      <SideBar
        langRoutePrefix={langRoutePrefix}
        pathname={pathname}
        sidebarData={sidebarData}
        isSidebarOpen={isSidebarOpen}
      />
      {isSidebarOpen ? (
        <div onClick={closeSidebar} className={styles.backDrop} />
      ) : null}
    </Fragment>
  );
}
