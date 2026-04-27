import { describe, expect, it } from 'vitest';
import { buildStructuredStyleValue, normalizeColorValue, parseStructuredStyleValue, validateStyleValue } from './styleValidators';

describe('styleValidators', () => {
  it('accepts valid size values and normalizes them', () => {
    expect(validateStyleValue('fontSize', '16px')).toEqual({ isValid: true, normalizedValue: '16px' });
    expect(validateStyleValue('fontSize', '1.50rem')).toEqual({ isValid: true, normalizedValue: '1.5rem' });
    expect(validateStyleValue('fontSize', '16 px').isValid).toBe(false);
    expect(validateStyleValue('fontSize', 'abc').isValid).toBe(false);
  });

  it('accepts valid colors and rejects arbitrary strings', () => {
    expect(validateStyleValue('color', '#fff')).toEqual({ isValid: true, normalizedValue: '#fff' });
    expect(validateStyleValue('color', 'rgb(255,0,0)')).toEqual({ isValid: true, normalizedValue: 'rgb(255, 0, 0)' });
    expect(validateStyleValue('color', 'brand-red').isValid).toBe(false);
    expect(normalizeColorValue('#FF0000')).toBe('#ff0000');
  });

  it('accepts only configured select values', () => {
    expect(validateStyleValue('fontWeight', '600')).toEqual({ isValid: true, normalizedValue: '600' });
    expect(validateStyleValue('fontWeight', 'bold').isValid).toBe(false);
    expect(validateStyleValue('textAlign', 'center')).toEqual({ isValid: true, normalizedValue: 'center' });
    expect(validateStyleValue('textAlign', 'start')).toEqual({ isValid: true, normalizedValue: 'start' });
    expect(validateStyleValue('textAlign', 'end')).toEqual({ isValid: true, normalizedValue: 'end' });
    expect(validateStyleValue('textAlign', 'middle').isValid).toBe(false);
    expect(validateStyleValue('fontStyle', 'italic')).toEqual({ isValid: true, normalizedValue: 'italic' });
    expect(validateStyleValue('fontStyle', 'slanted').isValid).toBe(false);
    expect(validateStyleValue('textDecoration', 'underline')).toEqual({ isValid: true, normalizedValue: 'underline' });
    expect(validateStyleValue('textDecoration', 'blink').isValid).toBe(false);
    expect(validateStyleValue('objectFit', 'cover')).toEqual({ isValid: true, normalizedValue: 'cover' });
    expect(validateStyleValue('objectFit', 'stretch').isValid).toBe(false);
    expect(validateStyleValue('backgroundRepeat', 'no-repeat')).toEqual({ isValid: true, normalizedValue: 'no-repeat' });
    expect(validateStyleValue('backgroundRepeat', 'tile').isValid).toBe(false);
    expect(validateStyleValue('backgroundSize', 'cover')).toEqual({ isValid: true, normalizedValue: 'cover' });
    expect(validateStyleValue('backgroundSize', 'stretch').isValid).toBe(false);
    expect(validateStyleValue('backgroundPosition', 'top left')).toEqual({ isValid: true, normalizedValue: 'top left' });
    expect(validateStyleValue('objectPosition', 'bottom right')).toEqual({ isValid: true, normalizedValue: 'bottom right' });
    expect(validateStyleValue('fontFamily', 'Montserrat')).toEqual({ isValid: true, normalizedValue: 'Montserrat' });
    expect(validateStyleValue('fontFamily', 'Suisse Intl')).toEqual({ isValid: true, normalizedValue: 'Suisse Intl' });
  });

  it('parses structured values for guided inputs', () => {
    expect(parseStructuredStyleValue('marginTop', '24px')).toEqual({ number: '24', unit: 'px', isValid: true });
    expect(parseStructuredStyleValue('lineHeight', '1.5')).toEqual({ number: '1.5', unit: '', isValid: true });
    expect(parseStructuredStyleValue('marginTop', 'big')).toEqual({ number: 'big', unit: 'px', isValid: false });
  });

  it('builds valid structured values from number and unit controls', () => {
    expect(buildStructuredStyleValue('borderRadius', '12', 'px')).toEqual({ isValid: true, normalizedValue: '12px' });
    expect(buildStructuredStyleValue('lineHeight', '1.4', '')).toEqual({ isValid: true, normalizedValue: '1.4' });
    expect(buildStructuredStyleValue('borderRadius', 'abc', 'px').isValid).toBe(false);
  });

  it('keeps invalid values detectable without crashing', () => {
    const result = validateStyleValue('fontSize', 'large');

    expect(result.isValid).toBe(false);
    expect(result.normalizedValue).toBe('large');
  });
});
