// @ts-ignore avoid circular dependency because the `doc-core` packgage will also import `doc-plugin-medium-zoom`
// the `@modern-js/doc-core` will be aliased to `doc-core` package
import { useLocation } from '@modern-js/doc-core/runtime';
import mediumZoom from 'medium-zoom';
import { useEffect } from 'react';
import './MediumZoom.css';

interface Props {
  selector?: string;
}

export default function MediumZoom(props: Props) {
  const { pathname } = useLocation();
  const { selector = '.modern-doc img' } = props;

  useEffect(() => {
    const images = document.querySelectorAll(selector);
    mediumZoom(images);
  }, [pathname]);
  return null;
}
