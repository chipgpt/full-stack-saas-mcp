import { forwardRef } from 'react';
import { Input } from './Input';

export interface ICheckboxProps {
  id?: string;
  name: string;
  value?: boolean;
  onChangeChecked(checked: boolean): void;
  label: string;
  disabled: boolean;
}

export const Checkbox = forwardRef<
  React.ElementRef<typeof Input>,
  ICheckboxProps
>((props, ref) => {
  const { label, id, ...rest } = props;
  return (
    <div className="flex gap-6 items-center">
      <div style={{ border: '3px solid black', marginRight: 'auto' }}>
        <Input
          ref={ref}
          id={id || props.name}
          type="checkbox"
          style={{ width: '25px', margin: -1, display: 'block' }}
          {...rest}
          onChange={e => {
            if ('checked' in e.currentTarget) {
              rest.onChangeChecked(!!e.currentTarget.checked);
            }
          }}
        />
      </div>
      <label style={{ flex: '1' }} htmlFor={id || props.name}>
        {label}
      </label>
    </div>
  );
});
Checkbox.displayName = 'Checkbox';
