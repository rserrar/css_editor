// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TargetNavigator } from './TargetNavigator';
import { I18nProvider } from '../../infrastructure/i18n/I18nContext';

function renderNavigator(props = {}) {
  const onHover = vi.fn();
  const onSelect = vi.fn();

  render(
    <I18nProvider>
      <TargetNavigator
        targets={['menu.option', 'layout.mainMenu/menu.option', 'layout.mainMenu/menu.subOption', 'layout.footerMenu/menu.option']}
        selectedTarget={null}
        styledTargets={new Set(['layout.mainMenu/menu.option'])}
        statefulTargets={new Set(['layout.mainMenu/menu.option'])}
        onHover={onHover}
        onSelect={onSelect}
        emptyMessage="No targets"
        title="Targets"
        {...props}
      />
    </I18nProvider>,
  );

  return { onHover, onSelect };
}

afterEach(() => {
  cleanup();
});

describe('TargetNavigator', () => {
  it('groups scoped keys by scope and legacy keys under no-scope group', () => {
    renderNavigator();

    expect(screen.getAllByText('layout.mainMenu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('layout.footerMenu').length).toBeGreaterThan(0);
    expect(screen.getByText('Sense scope')).toBeTruthy();
    expect(screen.getAllByText('menu.option').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('menu.subOption')).toBeTruthy();
  });

  it('filters targets by scope, target and full key and shows empty state when there are no matches', () => {
    renderNavigator();

    fireEvent.change(screen.getByPlaceholderText('Filtrar targets...'), { target: { value: 'mainMenu' } });
    expect(screen.getAllByText('layout.mainMenu').length).toBeGreaterThan(0);
    expect(screen.queryByText('layout.footerMenu')).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Filtrar targets...'), { target: { value: 'menu.subOption' } });
    expect(screen.getByText('menu.subOption')).toBeTruthy();
    expect(screen.queryByText('Sense scope')).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Filtrar targets...'), { target: { value: 'layout.footerMenu/menu.option' } });
    expect(screen.getAllByText('layout.footerMenu').length).toBeGreaterThan(0);
    expect(screen.queryByText('layout.mainMenu')).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Filtrar targets...'), { target: { value: 'missing-target' } });
    expect(screen.getByText('Cap target coincideix amb aquest filtre.')).toBeTruthy();
  });

  it('calls hover callbacks on mouse enter and leave', () => {
    const { onHover } = renderNavigator();

    const targetButton = screen.getByRole('button', { name: /layout\.mainmenu\/menu\.option/i });
    fireEvent.mouseEnter(targetButton);
    fireEvent.mouseLeave(targetButton);

    expect(onHover).toHaveBeenNthCalledWith(1, 'layout.mainMenu/menu.option');
    expect(onHover).toHaveBeenNthCalledWith(2, null);
  });

  it('calls select callback and marks scoped target as selected', () => {
    const { onSelect } = renderNavigator({ selectedTarget: 'layout.mainMenu/menu.option' });

    const targetButton = screen.getByRole('button', { name: /layout\.mainmenu\/menu\.option/i });
    fireEvent.click(targetButton);

    expect(onSelect).toHaveBeenCalledWith('layout.mainMenu/menu.option');
    expect(targetButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows a styled indicator for targets with styles', () => {
    renderNavigator();

    const styledButton = screen.getByRole('button', { name: /layout\.mainmenu\/menu\.option/i });
    expect(within(styledButton).getByLabelText('Amb estils')).toBeTruthy();
  });

  it('shows a state variants indicator for targets with non-default variants', () => {
    renderNavigator();

    const statefulButton = screen.getByRole('button', { name: /layout\.mainmenu\/menu\.option/i });
    expect(within(statefulButton).getByLabelText('Té variants d\'estat')).toBeTruthy();
  });

  it('does not show a state variants indicator for targets without non-default variants', () => {
    renderNavigator();

    const legacyButton = screen.getByRole('button', { name: /^menu\.option legacy menu\.option$/i });
    expect(within(legacyButton).queryByLabelText('Té variants d\'estat')).toBeNull();
  });

  it('shows mixed legacy and scoped entries without collapsing them visually', () => {
    renderNavigator();

    expect(screen.getByText('layout.mainMenu/menu.option')).toBeTruthy();
    expect(screen.getByText('layout.footerMenu/menu.option')).toBeTruthy();
    expect(screen.getAllByText('legacy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('scoped').length).toBeGreaterThan(0);
    expect(screen.getByText('Sense scope')).toBeTruthy();
  });

  it('shows global empty state without targets', () => {
    renderNavigator({ targets: [], styledTargets: new Set() });

    expect(screen.getByText('No targets')).toBeTruthy();
  });
});
