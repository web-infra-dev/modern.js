import { useState } from 'react';

export function useNav() {
  const [isScreenOpen, setIsScreenOpen] = useState(false);
  function openScreen() {
    setIsScreenOpen(true);
    window.addEventListener('resize', closeScreenOnTabletWindow);
  }

  function closeScreen() {
    setIsScreenOpen(false);
    window.removeEventListener('resize', closeScreenOnTabletWindow);
  }

  function toggleScreen() {
    if (isScreenOpen) {
      closeScreen();
    } else {
      openScreen();
    }
  }

  /**
   * Close screen when the user resizes the window wider than tablet size.
   */
  function closeScreenOnTabletWindow() {
    window.outerWidth >= 768 && closeScreen();
  }

  return {
    isScreenOpen,
    openScreen,
    closeScreen,
    toggleScreen,
  };
}
