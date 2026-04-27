import { describe, expect, it } from 'vitest';
import {
  buildCanonicalKey,
  getScopeFromKey,
  getTargetFromKey,
  matchesTargetKey,
  parseCanonicalKey,
  tryParseCanonicalKey,
} from './targetKey';

describe('targetKey', () => {
  describe('buildCanonicalKey', () => {
    it('builds a scoped canonical key when scope exists', () => {
      expect(buildCanonicalKey('layout.mainMenu', 'menu.option')).toBe('layout.mainMenu/menu.option');
    });

    it('rejects missing scopes', () => {
      expect(() => buildCanonicalKey('   ', 'menu.option')).toThrow('Target key requires a non-empty scope');
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
      });
    });

    it('throws on malformed scoped keys', () => {
      expect(() => parseCanonicalKey('menu.option')).toThrow('Canonical target key must use exactly one scope/target separator');
      expect(() => parseCanonicalKey('layout.mainMenu/')).toThrow('Canonical target key must contain both scope and target');
      expect(() => parseCanonicalKey('/menu.option')).toThrow('Canonical target key must contain both scope and target');
      expect(() => parseCanonicalKey('scope/target/extra')).toThrow('Canonical target key must use exactly one scope/target separator');
      expect(() => parseCanonicalKey('')).toThrow('Target key requires a non-empty key');
    });

    it('returns null from the safe parser for malformed keys', () => {
      expect(tryParseCanonicalKey('layout.mainMenu/menu.option')).toEqual({
        scope: 'layout.mainMenu',
        target: 'menu.option',
        canonicalKey: 'layout.mainMenu/menu.option',
      });
      expect(tryParseCanonicalKey('menu.option')).toBeNull();
      expect(tryParseCanonicalKey('scope/target/extra')).toBeNull();
    });
  });

  describe('accessor helpers', () => {
    it('extracts target and scope correctly', () => {
      expect(getScopeFromKey('layout.mainMenu/menu.option')).toBe('layout.mainMenu');
      expect(getTargetFromKey('layout.mainMenu/menu.option')).toBe('menu.option');
    });
  });

  describe('matchesTargetKey', () => {
    it('matches scoped keys exactly', () => {
      expect(matchesTargetKey('layout.mainMenu/menu.option', 'layout.mainMenu', 'menu.option')).toBe(true);
    });

    it('does not match different scoped keys', () => {
      expect(matchesTargetKey('layout.footerMenu/menu.option', 'layout.mainMenu', 'menu.option')).toBe(false);
    });
  });
});
