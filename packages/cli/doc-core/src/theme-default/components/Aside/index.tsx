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
    if (!window.location.hash) {
      window.scrollTo(0, 0);
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
          block="~"
          text="text-2"
          font="medium"
          hover="text-text-1"
          transition="color duration-300"
          className="leading-7"
          style={{
            fontSize: '13px',
            paddingLeft: (header.depth - baseHeaderLevel) * 12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          onClick={e => {
            e.preventDefault();
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
    <div flex="~ col 1" className="max-w-256px min-w-200px">
      <div className={hasOutline ? `<lg:hidden` : 'hidden'}>
        <div
          relative="~"
          p="l-4"
          text="sm"
          font-medium="~"
          id="aside-container"
          style={{
            borderLeft: '1px solid var(--modern-c-divider-light)',
          }}
        >
          <div
            absolute="~"
            opacity="0"
            w="1px"
            h="18px"
            bg="brand"
            ref={markerRef}
            style={{
              top: '33px',
              left: '-1px',
              transition:
                'top 0.25s cubic-bezier(0, 1, 0.5, 1), background-color 0.5s, opacity 0.25s',
            }}
            id="aside-marker"
          ></div>
          <div block="~" className="leading-7" text="sm" font="semibold">
            {props.outlineTitle}
          </div>
          <nav>
            <ul relative="~">{headers.map(renderHeader)}</ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
