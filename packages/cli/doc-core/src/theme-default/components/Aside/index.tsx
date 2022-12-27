import { useRef, useEffect } from 'react';
import { Header } from 'shared/types/index';
import { bindingAsideScroll } from '../../logic';

export function Aside(props: { headers: Header[]; outlineTitle: string }) {
  const { headers } = props;
  const hasOutline = headers.length > 0;
  // For outline text highlight
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unbinding: (() => void) | undefined;
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

  const renderHeader = (header: Header) => {
    return (
      <li key={header.id}>
        <a
          href={`#${header.id}`}
          block=""
          leading-7=""
          text="text-2"
          avoid-text-overflow=""
          hover="text-text-1"
          transition="color duration-300"
          style={{
            paddingLeft: (header.depth - 2) * 12,
          }}
        >
          {header.text}
        </a>
      </li>
    );
  };

  return (
    <div flex="~ col 1">
      <div display={`${hasOutline ? 'lg:block' : 'none'}`}>
        <div
          relative=""
          divider-left=""
          p="l-4"
          text="13px"
          font-medium=""
          id="aside-container"
        >
          <div
            absolute=""
            pos="top-33px"
            opacity="0"
            w="1px"
            h="18px"
            bg="brand"
            ref={markerRef}
            style={{
              left: '-1px',
              transition:
                'top 0.25s cubic-bezier(0, 1, 0.5, 1), background-color 0.5s, opacity 0.25s',
            }}
            id="aside-marker"
          ></div>
          <div block="~" leading-7="" text="13px" font="semibold">
            {props.outlineTitle}
          </div>
          <nav>
            <ul relative="">{headers.map(renderHeader)}</ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
