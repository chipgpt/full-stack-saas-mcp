"use client"

import {
  CSSProperties,
  FormEvent,
  HTMLInputTypeAttribute,
  KeyboardEvent,
  forwardRef,
} from 'react';
import { cn } from '@/lib/utils';

export interface IInputProps {
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
  name?: string;
  type: HTMLInputTypeAttribute;
  value?: string | number | boolean;
  onChange(e: FormEvent<HTMLInputElement | HTMLTextAreaElement>): void;
  onKeyDown?(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void;
  placeholder?: string;
  flex?: boolean;
  pad?: number;
  background?: string;
  height?: string | number;
  width?: string | number;
  style?: CSSProperties;
  maxLength?: number;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, IInputProps>((props, ref) => {
  const { pad = 16, style: overrideStyle, className, flex = false, maxLength } = props;

  const width =
    typeof props.width === 'string' ? props.width : props.width ? `${props.width}px` : props.width;

  const baseClasses = cn(
    // Base styling
    'w-full px-4 py-3 placeholder-gray-400',
    'border rounded-lg',
    // Typography
    'text-sm leading-relaxed',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Custom classes
    className
  );

  const style: CSSProperties = {
    flex: flex ? '1 1 100%' : 'none',
    width: width,
    minHeight: props.type === 'checkbox' ? '25px' : '50px',
    resize: 'none',
    ...overrideStyle,
  };

  const value = typeof props.value === 'boolean' ? (props.value ? 'checked' : '') : props.value;

  if (props.type === 'textarea') {
    return (
      <textarea
        id={props.id}
        rows={4}
        autoFocus={props.autoFocus}
        name={props.name}
        required={props.required}
        className={cn(baseClasses, 'min-h-[120px]')}
        style={style}
        value={value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        onKeyDown={props.onKeyDown}
        maxLength={maxLength}
      />
    );
  }

  return (
    <input
      ref={ref}
      id={props.id}
      autoFocus={props.autoFocus}
      name={props.name}
      type={props.type}
      required={props.required}
      className={baseClasses}
      style={style}
      value={value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      onKeyDown={props.onKeyDown}
      checked={!!props.value}
      maxLength={maxLength}
    />
  );
});

Input.displayName = 'Input';
