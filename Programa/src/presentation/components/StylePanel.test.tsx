// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../infrastructure/i18n/I18nContext';
import { StylePanel } from './StylePanel';

function renderPanel(props = {}) {
  const onChange = vi.fn();
  const onRemove = vi.fn();
  const onStyleStateSelect = vi.fn();
  const onCopyStateFromDefault = vi.fn();

  render(
    <I18nProvider>
      <StylePanel
        target="home.subscription/button.primary"
        styles={{ color: '#000000' }}
        configValue={{ default: { color: '#000000' } }}
        selectedStyleState="default"
        availableStates={['default']}
        onStyleStateSelect={onStyleStateSelect}
        onCopyStateFromDefault={onCopyStateFromDefault}
        onChange={onChange}
        onRemove={onRemove}
        {...props}
      />
    </I18nProvider>,
  );

  return { onChange, onRemove, onStyleStateSelect, onCopyStateFromDefault };
}

afterEach(() => cleanup());

function getStateButton(label: string) {
  return screen.getByText(label).closest('button') as HTMLButtonElement;
}

describe('StylePanel state selector', () => {
  it('renders state tabs and marks the active state', () => {
    renderPanel({
      selectedStyleState: 'hover',
      availableStates: ['default', 'hover'],
      configValue: {
        default: { color: '#000000' },
        hover: { color: '#ff0000' },
      },
    });

    expect(getStateButton('default')).toBeTruthy();
    expect(getStateButton('hover')).toBeTruthy();
    expect(getStateButton('selected')).toBeTruthy();
    expect(getStateButton('open')).toBeTruthy();
    expect(screen.getByText(/Variants detectades:/)).toBeTruthy();
    expect(screen.getAllByTitle('Conté estils').length).toBeGreaterThanOrEqual(2);
  });

  it('organizes properties into clearer groups', () => {
    renderPanel();

    expect(screen.getByText('Propietats habituals')).toBeTruthy();
    expect(screen.getByText('Text i tipografia')).toBeTruthy();
    expect(screen.getByText('Espaiat')).toBeTruthy();
    expect(screen.getByText('Superfície i vores')).toBeTruthy();
    expect(screen.getByText('Imatge i fons')).toBeTruthy();
  });

  it('shows a non-invasive summary of explicitly defined properties only', () => {
    renderPanel({
      styles: { color: '#000000', fontSize: '16px' },
      configValue: { default: { color: '#000000', fontSize: '16px' } },
    });

    expect(screen.getByText('Resum del que edites en aquest estat')).toBeTruthy();
    expect(screen.getAllByText('color').length).toBeGreaterThan(0);
    expect(screen.getByText('fontSize')).toBeTruthy();
    expect(screen.getByText(/No reflecteix estils heretats/)).toBeTruthy();
  });

  it('adds contextual help to selected and open states', () => {
    renderPanel();

    expect(getStateButton('selected').getAttribute('title')).toContain('Element seleccionat');
    expect(getStateButton('open').getAttribute('title')).toContain('Element obert');
  });

  it('shows default as defined and the rest empty when only base styles exist', () => {
    renderPanel({
      configValue: { default: { color: '#000000' } },
      availableStates: ['default'],
      selectedStyleState: 'default',
    });

    const defaultButton = getStateButton('default');
    const hoverButton = getStateButton('hover');

    expect(defaultButton.getAttribute('title')).toBe('Conté estils');
    expect(hoverButton.getAttribute('title')).toBe('Sense estils definits');
    expect(getStateButton('selected').getAttribute('title')).toContain('Sense estils definits');
  });

  it('calls onStyleStateSelect when switching state', () => {
    const { onStyleStateSelect } = renderPanel();

    fireEvent.click(getStateButton('hover'));
    expect(onStyleStateSelect).toHaveBeenCalledWith('hover');
  });

  it('shows copy from default only for non-default states', () => {
    renderPanel({ selectedStyleState: 'default' });
    expect(screen.queryByText('Copiar des de default')).toBeNull();

    cleanup();
    renderPanel({ selectedStyleState: 'hover' });
    expect(screen.getByText('Copiar des de default')).toBeTruthy();
  });

  it('keeps indicators coherent when switching between defined and empty states', () => {
    const { onStyleStateSelect } = renderPanel({
      configValue: {
        default: { color: '#000000' },
        hover: { color: '#ff0000' },
      },
      availableStates: ['default', 'hover'],
      selectedStyleState: 'default',
    });

    fireEvent.click(getStateButton('focus'));
    expect(onStyleStateSelect).toHaveBeenCalledWith('focus');
    expect(getStateButton('hover').getAttribute('title')).toBe('Conté estils');
    expect(getStateButton('focus').getAttribute('title')).toBe('Sense estils definits');
  });

  it('shows the styles of the active state', () => {
    renderPanel({
      styles: { color: '#ff0000' },
      configValue: {
        default: { color: '#000000' },
        hover: { color: '#ff0000' },
      },
      selectedStyleState: 'hover',
      availableStates: ['default', 'hover'],
    });

    expect((screen.getByLabelText('color') as HTMLInputElement).value).toBe('#ff0000');
  });

  it('allows editing an empty non-default state without crashing', () => {
    const { onChange } = renderPanel({
      styles: {},
      configValue: { default: { color: '#000000' } },
      selectedStyleState: 'hover',
      availableStates: ['default'],
    });

    fireEvent.click(screen.getByLabelText('color-enabled'));
    expect(onChange).toHaveBeenCalled();
  });

  it('calls copy from default for the selected non-default state', () => {
    const { onCopyStateFromDefault } = renderPanel({
      selectedStyleState: 'selected',
      configValue: { default: { color: '#000000' } },
      availableStates: ['default'],
    });

    fireEvent.click(screen.getByText('Copiar des de default'));
    expect(onCopyStateFromDefault).toHaveBeenCalled();
  });

  it('shows stateful targets with defined and empty states differentiated', () => {
    renderPanel({
      configValue: {
        default: { color: '#000000' },
        hover: { color: '#ff0000' },
      },
      availableStates: ['default', 'hover'],
      selectedStyleState: 'hover',
    });

    expect(getStateButton('default').getAttribute('title')).toBe('Conté estils');
    expect(getStateButton('hover').getAttribute('title')).toBe('Conté estils');
    expect(getStateButton('focus').getAttribute('title')).toBe('Sense estils definits');
    expect(getStateButton('active').getAttribute('title')).toBe('Sense estils definits');
    expect(getStateButton('disabled').getAttribute('title')).toBe('Sense estils definits');
    expect(getStateButton('selected').getAttribute('title')).toContain('Sense estils definits');
    expect(getStateButton('open').getAttribute('title')).toContain('Sense estils definits');
  });

  it('shows semantic states as defined when selected or open styles exist', () => {
    renderPanel({
      configValue: {
        default: { color: '#000000' },
        selected: { fontWeight: '700' },
        open: { color: '#0055ff' },
      },
      availableStates: ['default', 'selected', 'open'],
      selectedStyleState: 'selected',
      styles: { fontWeight: '700' },
    });

    expect(getStateButton('selected').getAttribute('title')).toContain('Conté estils');
    expect(getStateButton('open').getAttribute('title')).toContain('Conté estils');
  });

  it('keeps non-semantic states without extra semantic help text', () => {
    renderPanel();

    expect(getStateButton('hover').getAttribute('title')).toBe('Sense estils definits');
    expect(getStateButton('focus').getAttribute('title')).toBe('Sense estils definits');
  });

  it('removes a property only through the active state controls', () => {
    const { onRemove } = renderPanel({
      styles: { color: '#ff0000' },
      configValue: {
        default: { color: '#000000' },
        hover: { color: '#ff0000' },
      },
      selectedStyleState: 'hover',
      availableStates: ['default', 'hover'],
    });

    fireEvent.click(screen.getByLabelText('color-enabled'));
    expect(onRemove).toHaveBeenCalledWith('color');
  });
});
