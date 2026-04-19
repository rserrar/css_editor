import { describe, expect, it } from 'vitest';
import { canUseIncrementalDefaultMessages, copyStateFromDefault, getDefinedStates, getStateStyles, isEditableStyleSet, isStatefulStyle, normalizeToStateful, removeFromDefaultState, removeFromState, updateDefaultState, updateStateStyles } from './styleStateHelpers';

describe('styleStateHelpers', () => {
  it('detects legacy editable style sets', () => {
    expect(isEditableStyleSet({ color: '#fff', fontSize: '16px' })).toBe(true);
    expect(isEditableStyleSet({ default: { color: '#fff' } })).toBe(false);
  });

  it('detects valid stateful styles', () => {
    expect(isStatefulStyle({ default: { color: '#fff' }, hover: { color: '#000' } })).toBe(true);
    expect(isStatefulStyle({ selected: { color: '#fff' } })).toBe(true);
    expect(isStatefulStyle({ open: { color: '#fff' } })).toBe(true);
    expect(isStatefulStyle({ color: '#fff', hover: { color: '#000' } })).toBe(false);
  });

  it('normalizes legacy values to default state', () => {
    expect(normalizeToStateful({ color: '#fff' })).toEqual({ default: { color: '#fff' } });
  });

  it('returns state styles with empty fallback', () => {
    expect(getStateStyles({ default: { color: '#fff' }, hover: { color: '#000' } }, 'hover')).toEqual({ color: '#000' });
    expect(getStateStyles({ color: '#fff' }, 'hover')).toEqual({});
  });

  it('lists only defined runtime states', () => {
    expect(getDefinedStates({ default: { color: '#fff' }, focus: { color: '#111' }, selected: { color: '#222' }, open: { color: '#333' } })).toEqual(['default', 'focus', 'selected', 'open']);
  });

  it('updates and removes only the default state for compatibility editing', () => {
    const stateful = { default: { color: '#fff' }, hover: { color: '#000' } };
    expect(updateDefaultState(stateful, { fontSize: '18px' })).toEqual({
      default: { color: '#fff', fontSize: '18px' },
      hover: { color: '#000' },
    });

    expect(removeFromDefaultState(stateful, ['color'])).toEqual({
      default: {},
      hover: { color: '#000' },
    });
  });

  it('updates and removes a non-default state without mutating default', () => {
    const legacy = { color: '#fff' };
    expect(updateStateStyles(legacy, 'hover', { color: '#f00' })).toEqual({
      default: { color: '#fff' },
      hover: { color: '#f00' },
    });
    expect(updateStateStyles(legacy, 'selected', { fontWeight: '700' })).toEqual({
      default: { color: '#fff' },
      selected: { fontWeight: '700' },
    });
    expect(updateStateStyles(legacy, 'open', { color: '#0af' })).toEqual({
      default: { color: '#fff' },
      open: { color: '#0af' },
    });

    const stateful = { default: { color: '#fff' }, hover: { color: '#f00', fontSize: '18px' } };
    expect(removeFromState(stateful, 'hover', ['color'])).toEqual({
      default: { color: '#fff' },
      hover: { fontSize: '18px' },
    });

    const semanticStateful = { default: { color: '#fff' }, selected: { color: '#f00' }, open: { color: '#0af' } };
    expect(removeFromState(semanticStateful, 'selected', ['color'])).toEqual({
      default: { color: '#fff' },
      selected: {},
      open: { color: '#0af' },
    });
  });

  it('knows when incremental default protocol messages remain safe to use', () => {
    expect(canUseIncrementalDefaultMessages({ color: '#fff' }, 'default')).toBe(true);
    expect(canUseIncrementalDefaultMessages({ default: { color: '#fff' } }, 'default')).toBe(false);
    expect(canUseIncrementalDefaultMessages({ color: '#fff' }, 'hover')).toBe(false);
  });

  it('copies default state into a non-default destination and overwrites it', () => {
    expect(copyStateFromDefault({ color: '#000' }, 'hover')).toEqual({
      default: { color: '#000' },
      hover: { color: '#000' },
    });

    expect(copyStateFromDefault({
      default: { color: '#000', fontSize: '16px' },
      hover: { color: '#f00' },
    }, 'hover')).toEqual({
      default: { color: '#000', fontSize: '16px' },
      hover: { color: '#000', fontSize: '16px' },
    });

    expect(copyStateFromDefault({
      default: { color: '#000' },
      selected: { color: '#f00' },
    }, 'selected')).toEqual({
      default: { color: '#000' },
      selected: { color: '#000' },
    });
  });
});
