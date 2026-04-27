// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../infrastructure/i18n/I18nContext';
import { StyleValueField } from './StyleValueField';

function renderField(props: Partial<ComponentProps<typeof StyleValueField>> & { property: ComponentProps<typeof StyleValueField>['property'] }) {
  const onChange = vi.fn();
  const onRemove = vi.fn();

  render(
    <I18nProvider>
      <StyleValueField
        property={props.property}
        value={props.value ?? '16px'}
        onChange={onChange}
        onRemove={onRemove}
      />
    </I18nProvider>,
  );

  return { onChange, onRemove };
}

afterEach(() => {
  cleanup();
});

describe('StyleValueField', () => {
  it('renders size fields as number input plus unit select', () => {
    renderField({ property: 'fontSize', value: '16px' });

    expect(screen.getByLabelText('fontSize-number')).toBeTruthy();
    expect(screen.getByLabelText('fontSize-unit')).toBeTruthy();
  });

  it('renders color fields as color picker plus text input', () => {
    renderField({ property: 'color', value: '#ff0000' });

    expect(screen.getByLabelText('color-picker')).toBeTruthy();
    expect(screen.getByLabelText('color')).toBeTruthy();
  });

  it('renders select fields as dropdown', () => {
    renderField({ property: 'fontWeight', value: '600' });

    expect(screen.getByLabelText('fontWeight')).toBeTruthy();
    expect(screen.getByRole('option', { name: '600' })).toBeTruthy();
  });

  it('calls onChange for valid structured values and keeps them normalized', () => {
    const { onChange } = renderField({ property: 'fontSize', value: '16px' });

    fireEvent.change(screen.getByLabelText('fontSize-number'), { target: { value: '24' } });
    fireEvent.change(screen.getByLabelText('fontSize-unit'), { target: { value: 'rem' } });

    expect(onChange).toHaveBeenCalledWith('24px');
    expect(onChange).toHaveBeenLastCalledWith('24rem');
  });

  it('accepts valid color values and ignores invalid ones without crashing', () => {
    const { onChange } = renderField({ property: 'color', value: '#ff0000' });

    fireEvent.change(screen.getByLabelText('color'), { target: { value: 'rgb(255,0,0)' } });
    expect(onChange).toHaveBeenCalledWith('rgb(255, 0, 0)');

    const callsBeforeInvalid = onChange.mock.calls.length;
    fireEvent.change(screen.getByLabelText('color'), { target: { value: 'brand-red' } });
    expect(onChange.mock.calls).toHaveLength(callsBeforeInvalid);
  });

  it('shows warning for invalid values and allows correcting them', () => {
    const { onChange } = renderField({ property: 'fontSize', value: 'large' });

    expect(screen.getByText('El valor actual no encaixa amb el format esperat. El pots corregir sense perdre\'l.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('fontSize'), { target: { value: '18px' } });
    expect(onChange).toHaveBeenCalledWith('18px');
  });

  it('removes a property when disabling it from the checkbox', () => {
    const { onRemove } = renderField({ property: 'color', value: '#ff0000' });

    fireEvent.click(screen.getByLabelText('color-enabled'));
    expect(onRemove).toHaveBeenCalled();
  });

  it('restores the last known value with reset', () => {
    const { onChange } = renderField({ property: 'color', value: '#ff0000' });

    fireEvent.click(screen.getByLabelText('color-reset'));
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });

  it('falls back to the property default instead of leaking the previous state value when empty', () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();

    const { rerender } = render(
      <I18nProvider>
        <StyleValueField property="backgroundColor" value="#ff0000" onChange={onChange} onRemove={onRemove} />
      </I18nProvider>,
    );

    rerender(
      <I18nProvider>
        <StyleValueField property="backgroundColor" value="" onChange={onChange} onRemove={onRemove} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByLabelText('backgroundColor-enabled'));
    expect(onChange).toHaveBeenLastCalledWith('#ffffff');
  });

  it('applies backgroundColor through the color picker like other color properties', () => {
    const { onChange } = renderField({ property: 'backgroundColor', value: '#ffffff' });

    fireEvent.change(screen.getByLabelText('backgroundColor-picker'), { target: { value: '#00ff00' } });
    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });
});
