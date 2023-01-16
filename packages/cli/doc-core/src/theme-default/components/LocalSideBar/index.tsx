import { Fragment, useState } from 'react';
import { NormalizedSidebarGroup, SidebarItem } from 'shared/types';
import { SideBar } from '../Siderbar';
import MenuIcon from '../../assets/menu.svg';
import styles from './index.module.scss';

interface Props {
  pathname: string;
  langRoutePrefix: string;
  sidebarData: (NormalizedSidebarGroup | SidebarItem)[];
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
        <button flex="~ center" onClick={openSidebar} className={styles.menu}>
          <div text="md" m="r-2">
            <MenuIcon />
          </div>
          <span text="sm">Menu</span>
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
