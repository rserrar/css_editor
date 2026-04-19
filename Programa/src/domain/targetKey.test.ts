import { describe, expect, it } from 'vitest';
import {
  buildCanonicalKey,
  getScopeFromKey,
  getTargetFromKey,
  hasScopedTargetKey,
  matchesTargetKey,
  parseCanonicalKey,
} from './targetKey';

describe('targetKey', () => {
  describe('buildCanonicalKey', () => {
    it('builds a scoped canonical key when scope exists', () => {
      expect(buildCanonicalKey('layout.mainMenu', 'menu.option')).toBe('layout.mainMenu/menu.option');
    });

    it('keeps legacy target-only keys unchanged when scope is absent', () => {
      expect(buildCanonicalKey(undefined, 'menu.option')).toBe('menu.option');
      expect(buildCanonicalKey(null, 'menu.option')).toBe('menu.option');
      expect(buildCanonicalKey('   ', 'menu.option')).toBe('menu.option');
    });

    it('trims scope and target safely', () => {
      expect(buildCanonicalKey('  layout.mainMenu  ', '  menu.option  ')).toBe('layout.mainMenu/menu.option');
    });

    it('throws on empty target', () => {
      expect(() => buildCanonicalKey('layout.mainMenu', '')).toThrow('Target key requires a non-empty target');
    });
  });

  describe('parseCanonicalKey', () => {
    it('parses scoped keys', () => {
      expect(parseCanonicalKey('layout.mainMenu/menu.option')).toEqual({
        scope: 'layout.mainMenu',
        target: 'menu.option',
        canonicalKey: 'layout.mainMenu/menu.option',
        hasScope: true,
      });
    });

    it('parses legacy target-only keys', () => {
      expect(parseCanonicalKey('menu.option')).toEqual({
        scope: null,
        target: 'menu.option',
        canonicalKey: 'menu.option',
        hasScope: false,
      });
    });

    it('throws on malformed scoped keys', () => {
      expect(() => parseCanonicalKey('layout.mainMenu/')).toThrow('Canonical target key must contain both scope and target');
      expect(() => parseCanonicalKey('/menu.option')).toThrow('Canonical target key must contain both scope and target');
      expect(() => parseCanonicalKey('')).toThrow('Target key requires a non-empty key');
    });
  });

  describe('accessor helpers', () => {
    it('extracts target and scope correctly', () => {
      expect(getScopeFromKey('layout.mainMenu/menu.option')).toBe('layout.mainMenu');
      expect(getTargetFromKey('layout.mainMenu/menu.option')).toBe('menu.option');
      expect(getScopeFromKey('menu.option')).toBeNull();
      expect(getTargetFromKey('menu.option')).toBe('menu.option');
    });

    it('detects whether a key is scoped', () => {
      expect(hasScopedTargetKey('layout.mainMenu/menu.option')).toBe(true);
      expect(hasScopedTargetKey('menu.option')).toBe(false);
    });
  });

  describe('matchesTargetKey', () => {
    it('matches scoped keys exactly', () => {
      expect(matchesTargetKey('layout.mainMenu/menu.option', 'layout.mainMenu', 'menu.option')).toBe(true);
    });

    it('matches legacy target-only keys exactly', () => {
      expect(matchesTargetKey('menu.option', undefined, 'menu.option')).toBe(true);
    });

    it('does not mix scoped and unscoped keys', () => {
      expect(matchesTargetKey('menu.option', 'layout.mainMenu', 'menu.option')).toBe(false);
      expect(matchesTargetKey('layout.mainMenu/menu.option', undefined, 'menu.option')).toBe(false);
    });
  });
});
