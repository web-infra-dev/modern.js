import React, { useState } from 'react';
import { useEvent } from 'react-use';

export interface StickyDraggableOptions {
  margin?: string | number;
  clamp?: boolean;
}

const isCrossMargin = (a: string, b: string) =>
  ({
    top: ['left', 'right'],
    bottom: ['left', 'right'],
    left: ['top', 'bottom'],
    right: ['top', 'bottom'],
  }[a]?.includes(b) ?? false);

interface DraggingState {
  el: HTMLElement;
  clickable: boolean;
  moveable: boolean;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
}

const RECT_SIDES = ['top', 'bottom', 'left', 'right'] as const;

type RectSide = (typeof RECT_SIDES)[number];

interface OrderedRectSide {
  key: RectSide;
  value: number;
}

const sortRectSides = (sides: Record<RectSide, number>) => {
  const arr: OrderedRectSide[] = [
    { key: 'top', value: sides.top },
    { key: 'bottom', value: sides.bottom },
    { key: 'left', value: sides.left },
    { key: 'right', value: sides.right },
  ];
  const [primary, ...rest] = arr.sort((a, b) => a.value - b.value);
  const _secondaryIndex = rest.findIndex(({ key }) =>
    isCrossMargin(primary.key, key),
  );
  const [secondary] = rest.splice(_secondaryIndex, 1);
  return [primary, secondary, rest[0], rest[1]] as const;
};

const getElementRectSides = (el: HTMLElement): Record<RectSide, number> => {
  const { top, left, height, width } = el.getBoundingClientRect();
  return {
    top,
    left,
    bottom: window.innerHeight - top - height,
    right: window.innerWidth - left - width,
  };
};

export const useStickyDraggable = (options?: StickyDraggableOptions) => {
  const rawMargin = options?.margin ?? '10px';
  const margin = typeof rawMargin === 'number' ? `${rawMargin}px` : rawMargin;
  const [state, setState] = useState<DraggingState>();

  const handleRelease = () => {
    if (!state) {
      return;
    }
    state.moveable = false;
    const { el } = state;
    const [primary] = sortRectSides(getElementRectSides(el));
    el.style.transition = `${primary.key} 200ms`;
    requestIdleCallback(() => {
      setState(undefined);
      el.style[primary.key] = margin;
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!state?.moveable) {
      return;
    }
    const { startX, startY } = state;
    if ((startX - e.clientX) ** 2 + (startY - e.clientY) ** 2 > 9) {
      state.clickable = false;
    }
    const { width, height } = state.el.getBoundingClientRect();
    const top = e.clientY - state.offsetY;
    const left = e.clientX - state.offsetX;
    const sides: Record<RectSide, number> = {
      top,
      left,
      bottom: window.innerHeight - top - height,
      right: window.innerWidth - left - width,
    };
    const ordered = sortRectSides(sides).map(({ key, value }) => ({
      key,
      value: `${value}px`,
    }));
    if (options?.clamp) {
      for (const side of ordered) {
        const maxValue = ['top', 'bottom'].includes(side.key)
          ? window.innerHeight - height
          : window.innerWidth - width;
        side.value = `clamp(${margin}, ${side.value}, ${maxValue}px)`;
      }
    }
    const [primary, secondary, ...rest] = ordered;
    const { style } = state.el;
    style.transition = '';
    style[primary.key] = primary.value;
    style[secondary.key] = secondary.value;
    style[rest[0].key] = 'auto';
    style[rest[1].key] = 'auto';
  };

  useEvent('blur', handleRelease);
  useEvent('mouseup', handleRelease);
  useEvent('mousemove', handleMouseMove);

  const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    setState({
      el: e.currentTarget,
      clickable: true,
      moveable: true,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  const onClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    state?.clickable || e.stopPropagation();
  };

  return {
    isDragging: Boolean(state),
    props: {
      onMouseDown,
      onClickCapture,
    },
  };
};
