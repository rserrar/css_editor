import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STYLE_STATE,
  getStyleStateDefinition,
  isCssStyleState,
  isSemanticStyleState,
  isStyleStateId,
  STYLE_STATE_IDS,
} from './styleStates';

describe('styleStates', () => {
  it('defines a stable ordered list of supported future state ids', () => {
    expect(STYLE_STATE_IDS).toEqual([
      'default',
      'hover',
      'focus',
      'active',
      'disabled',
      'selected',
      'open',
      'expanded',
      'current',
      'checked',
    ]);
    expect(DEFAULT_STYLE_STATE).toBe('default');
  });

  it('classifies css and semantic states explicitly', () => {
    expect(isCssStyleState('hover')).toBe(true);
    expect(isCssStyleState('active')).toBe(true);
    expect(isSemanticStyleState('selected')).toBe(true);
    expect(isSemanticStyleState('open')).toBe(true);
  });

  it('validates known state ids only', () => {
    expect(isStyleStateId('default')).toBe(true);
    expect(isStyleStateId('hover')).toBe(true);
    expect(isStyleStateId('selected')).toBe(true);
    expect(isStyleStateId('pressed')).toBe(false);
  });

  it('exposes selector or dom hints for future implementation', () => {
    expect(getStyleStateDefinition('hover').selectorHint).toBe(':hover');
    expect(getStyleStateDefinition('selected').domSignals).toContain('aria-selected="true"');
    expect(getStyleStateDefinition('checked').domSignals).toContain('checked');
  });
});
