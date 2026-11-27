// Adapted from shadcn/ui's New York registry (MIT), using local CSS tokens.
import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SelectPrimitive from '@radix-ui/react-select';
export {
  Root as Tabs,
  List as TabsList,
  Trigger as TabsTrigger,
  Content as TabsContent,
} from '@radix-ui/react-tabs';
import './controls.css';

export function Button({
  className = '',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`ui-button ${className}`} {...props} />;
}
export function Checkbox({
  className = '',
  onCheckedChange,
  ...props
}: Omit<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'onCheckedChange'
> & { onCheckedChange?: (checked: boolean) => void }) {
  return (
    <CheckboxPrimitive.Root
      className={`ui-checkbox ${className}`}
      onCheckedChange={checked => onCheckedChange?.(checked === true)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="ui-checkbox-indicator">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          aria-hidden="true"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
const emptyValue = '__lab_empty';
export function Select({
  value,
  onValueChange,
  children,
  ...props
}: {
  value: string | number;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
} & Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
  'value' | 'onChange'
>) {
  const selected = String(value) || emptyValue;
  return (
    <SelectPrimitive.Root
      value={selected}
      onValueChange={v => onValueChange(v === emptyValue ? '' : v)}
      disabled={props.disabled}
    >
      <SelectPrimitive.Trigger
        {...props}
        className={`ui-select-trigger ${props.className || ''}`}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon className="ui-select-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="ui-select-content"
          position="popper"
          sideOffset={5}
        >
          <SelectPrimitive.ScrollUpButton className="ui-select-scroll">
            ⌃
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="ui-select-viewport">
            {children}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="ui-select-scroll">
            ⌄
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
export function SelectItem({
  value,
  children,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <SelectPrimitive.Item
      data-value={value}
      value={value || emptyValue}
      disabled={disabled}
      className="ui-select-item"
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ui-select-check">
        ✓
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
