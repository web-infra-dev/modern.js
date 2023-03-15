import { useRef, useEffect } from 'react';
import { Header } from 'shared/types/index';
import { bindingAsideScroll, scrollToTarget } from '../../logic';

export function Aside(props: { headers: Header[]; outlineTitle: string }) {
  const { headers } = props;
  const hasOutline = headers.length > 0;
  // For outline text highlight
  const markerRef = useRef<HTMLDivElement>(null);
  const baseHeaderLevel = headers[0]?.depth || 2;

  useEffect(() => {
    let unbinding: (() => void) | undefined;
    if (markerRef.current) {
      markerRef.current.style.opacity = '0';
    }
    setTimeout(() => {
      unbinding = bindingAsideScroll();
    }, 100);
    const hash = decodeURIComponent(window.location.hash);
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        scrollToTarget(target, false);
      }
    }
    return () => {
      if (unbinding) {
        unbinding();
      }
    };
  }, [headers]);

  // const handleHeaderClick = e => {};

  const renderHeader = (header: Header) => {
    return (
      <li key={header.id}>
        <a
          href={`#${header.id}`}
          className="leading-7 transition-colors duration-300 hover:text-text-1 text-text-2 block"
          style={{
            fontSize: '13px',
            paddingLeft: (header.depth - baseHeaderLevel) * 12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          onClick={e => {
            e.preventDefault();
            window.location.hash = header.id;
            const target = document.getElementById(header.id);
            if (target) {
              scrollToTarget(target, false);
            }
          }}
        >
          {header.text}
        </a>
      </li>
    );
  };

  return (
    <div className="flex flex-col">
      <div className={hasOutline ? `<lg:hidden` : 'hidden'}>
        <div
          id="aside-container"
          style={{
            borderLeft: '1px solid var(--modern-c-divider-light)',
          }}
          className="relative pl-4 text-sm font-medium"
        >
          <div
            className="absolute opacity-0 bg-brand"
            ref={markerRef}
            style={{
              width: '1px',
              height: '18px',
              top: '33px',
              left: '-1px',
              transition:
                'top 0.25s cubic-bezier(0, 1, 0.5, 1), background-color 0.5s, opacity 0.25s',
            }}
            id="aside-marker"
          ></div>
          <div className="leading-7 block text-sm font-semibold">
            {props.outlineTitle}
          </div>
          <nav>
            <ul className="relative">{headers.map(renderHeader)}</ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
