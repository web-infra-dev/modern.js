import { throttle } from 'lodash-es';
import { setupCopyCodeButton } from './copyCode';
import { inBrowser } from '@/shared/utils';

const DEFAULT_NAV_HEIGHT = 56;

export function scrollToTarget(target: HTMLElement, isSmooth: boolean) {
  const targetPadding = parseInt(
    window.getComputedStyle(target).paddingTop,
    10,
  );

  const targetTop =
    window.scrollY +
    target.getBoundingClientRect().top -
    DEFAULT_NAV_HEIGHT +
    targetPadding;
  // Only scroll smoothly in page header anchor
  window.scrollTo({
    left: 0,
    top: targetTop,
    ...(isSmooth ? { behavior: 'smooth' } : {}),
  });
}

// Control the scroll behavior of the browser when user clicks on a link
function bindingWindowScroll() {
  // Initial scroll position
  function scrollTo(el: HTMLElement, hash: string, isSmooth = false) {
    let target: HTMLElement | null = null;
    try {
      target = el.classList.contains('header-anchor')
        ? el
        : document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch (e) {
      console.warn(e);
    }
    if (target) {
      scrollToTarget(target, isSmooth);
    }
  }

  window.addEventListener(
    'click',
    e => {
      // Only handle a tag click
      const link = (e.target as Element).closest('a');
      if (link) {
        const { origin, hash, target, pathname, search } = link;
        const currentUrl = window.location;
        // only intercept inbound links
        if (hash && target !== '_blank' && origin === currentUrl.origin) {
          // scroll between hash anchors in the same page
          if (
            pathname === currentUrl.pathname &&
            search === currentUrl.search &&
            hash &&
            hash !== currentUrl.hash &&
            link.classList.contains('header-anchor')
          ) {
            e.preventDefault();
            history.pushState(null, '', hash);
            // use smooth scroll when clicking on header anchor links
            scrollTo(link, hash, true);
            // still emit the event so we can listen to it in themes
            window.dispatchEvent(new Event('hashchange'));
          }
        }
      }
    },
    { capture: true },
  );
  window.addEventListener('hashchange', e => {
    e.preventDefault();
  });
}

// Binding the scroll event to the aside element
export function bindingAsideScroll() {
  function isBottom() {
    return (
      document.documentElement.scrollTop + window.innerHeight >=
      document.documentElement.scrollHeight
    );
  }
  const NAV_HEIGHT = 56;
  const marker = document.getElementById('aside-marker');
  const aside = document.getElementById('aside-container');
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.modern-doc .header-anchor'),
  ).filter(item => item.parentElement?.tagName !== 'H1');

  if (!aside || !links.length) {
    return;
  }

  let prevActiveLink: null | HTMLAnchorElement = null;
  const headers = Array.from(aside?.getElementsByTagName('a') || []).map(item =>
    decodeURIComponent(item.hash),
  );
  if (marker && !headers.length) {
    marker.style.opacity = '0';
    return;
  }
  // Util function to set dom ref after determining the active link
  const activate = (links: HTMLAnchorElement[], index: number) => {
    if (prevActiveLink) {
      prevActiveLink.classList.remove('aside-active');
    }
    if (links[index]) {
      links[index].classList.add('aside-active');
      const id = links[index].getAttribute('href');
      const tocIndex = headers.findIndex(item => item === id);
      const currentLink = aside?.querySelector(`a[href="#${id?.slice(1)}"]`);
      if (currentLink) {
        prevActiveLink = currentLink as HTMLAnchorElement;
        // Activate the a link element in aside
        prevActiveLink.classList.add('aside-active');
        // Activate the marker element
        marker!.style.top = `${33 + tocIndex * 28}px`;
        marker!.style.opacity = '1';
      }
    }
  };
  const setActiveLink = () => {
    if (isBottom()) {
      activate(links, links.length - 1);
    } else {
      // Compute current index
      for (let i = 0; i < links.length; i++) {
        const currentAnchor = links[i];
        const nextAnchor = links[i + 1];
        const scrollTop = Math.ceil(window.scrollY);
        const currentAnchorTop =
          currentAnchor.parentElement!.offsetTop - NAV_HEIGHT;
        if ((i === 0 && scrollTop < currentAnchorTop) || scrollTop === 0) {
          activate(links, 0);
          break;
        }

        if (!nextAnchor) {
          activate(links, i);
          break;
        }

        const nextAnchorTop = nextAnchor.parentElement!.offsetTop - NAV_HEIGHT;

        if (scrollTop >= currentAnchorTop && scrollTop < nextAnchorTop) {
          activate(links, i);
          break;
        }
      }
    }
  };
  const throttledSetLink = throttle(setActiveLink, 200);

  window.addEventListener('scroll', throttledSetLink);

  // eslint-disable-next-line consistent-return
  return () => {
    window.removeEventListener('scroll', throttledSetLink);
  };
}

export function setup() {
  if (!inBrowser()) {
    return;
  }
  bindingWindowScroll();
  setupCopyCodeButton();
}
