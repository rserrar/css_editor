import { AllowedStyleKey } from './models';
import { getStyleSchema, StylePropertySchema } from './styleSchema';

const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s.,#%()\-!"']+$/;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGB_COLOR_REGEX = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;
const NUMERIC_VALUE_REGEX = /^-?(?:\d+|\d*\.\d+)$/;

export interface StyleValidationResult {
  isValid: boolean;
  normalizedValue: string;
  reason?: string;
}

export interface ParsedStructuredValue {
  number: string;
  unit: string;
  isValid: boolean;
}

function normalizeNumericString(value: string): string {
  return String(Number(value));
}

function normalizeRgbColor(value: string): string {
  const match = value.match(RGB_COLOR_REGEX);
  if (!match) return value.trim();

  const [, r, g, b, alpha] = match;
  const red = Number(r);
  const green = Number(g);
  const blue = Number(b);
  if ([red, green, blue].some((channel) => channel < 0 || channel > 255)) {
    return value.trim();
  }

  if (typeof alpha === 'undefined') {
    return `rgb(${red}, ${green}, ${blue})`;
  }

  const normalizedAlpha = String(Number(alpha));
  return `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha})`;
}

export function normalizeColorValue(value: string): string {
  const trimmed = value.trim();
  if (HEX_COLOR_REGEX.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (RGB_COLOR_REGEX.test(trimmed)) {
    return normalizeRgbColor(trimmed);
  }

  return trimmed;
}

function validateColor(value: string, schema: StylePropertySchema): StyleValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      isValid: Boolean(schema.allowEmpty),
      normalizedValue: '',
      reason: schema.allowEmpty ? undefined : 'required',
    };
  }

  if (!HEX_COLOR_REGEX.test(trimmed) && !RGB_COLOR_REGEX.test(trimmed)) {
    return { isValid: false, normalizedValue: trimmed, reason: 'invalid-color' };
  }

  const normalizedValue = normalizeColorValue(trimmed);
  return { isValid: true, normalizedValue };
}

function validateSelect(value: string, schema: StylePropertySchema): StyleValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      isValid: Boolean(schema.allowEmpty),
      normalizedValue: '',
      reason: schema.allowEmpty ? undefined : 'required',
    };
  }

  if (!schema.options?.includes(trimmed)) {
    return { isValid: false, normalizedValue: trimmed, reason: 'invalid-option' };
  }

  return { isValid: true, normalizedValue: trimmed };
}

function validateText(value: string, schema: StylePropertySchema): StyleValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      isValid: Boolean(schema.allowEmpty),
      normalizedValue: '',
      reason: schema.allowEmpty ? undefined : 'required',
    };
  }

  if (!SAFE_TEXT_REGEX.test(trimmed)) {
    return { isValid: false, normalizedValue: trimmed, reason: 'unsafe-text' };
  }

  return { isValid: true, normalizedValue: trimmed.replace(/\s+/g, ' ') };
}

function validateStructuredValue(value: string, schema: StylePropertySchema): StyleValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      isValid: Boolean(schema.allowEmpty),
      normalizedValue: '',
      reason: schema.allowEmpty ? undefined : 'required',
    };
  }

  if (schema.allowUnitless && NUMERIC_VALUE_REGEX.test(trimmed)) {
    if (!schema.allowNegative && Number(trimmed) < 0) {
      return { isValid: false, normalizedValue: trimmed, reason: 'negative-not-allowed' };
    }
    return { isValid: true, normalizedValue: normalizeNumericString(trimmed) };
  }

  const units = schema.units || [];
  const unitPattern = units.map((unit) => unit.replace('%', '%')).join('|');
  const match = trimmed.match(new RegExp(`^(-?(?:\\d+|\\d*\\.\\d+))(${unitPattern})$`));
  if (!match) {
    return { isValid: false, normalizedValue: trimmed, reason: 'invalid-size' };
  }

  const [, rawNumber, unit] = match;
  if (!schema.allowNegative && Number(rawNumber) < 0) {
    return { isValid: false, normalizedValue: trimmed, reason: 'negative-not-allowed' };
  }

  return {
    isValid: true,
    normalizedValue: `${normalizeNumericString(rawNumber)}${unit}`,
  };
}

export function validateStyleValue(property: AllowedStyleKey, value: string): StyleValidationResult {
  const schema = getStyleSchema(property);

  switch (schema.type) {
    case 'color':
      return validateColor(value, schema);
    case 'select':
      return validateSelect(value, schema);
    case 'text':
      return validateText(value, schema);
    case 'size':
    case 'spacing':
      return validateStructuredValue(value, schema);
    default:
      return { isValid: true, normalizedValue: value.trim() };
  }
}

export function parseStructuredStyleValue(property: AllowedStyleKey, value: string): ParsedStructuredValue {
  const schema = getStyleSchema(property);
  const trimmed = value.trim();
  const defaultUnit = schema.units?.[0] || 'px';

  if (!trimmed) {
    return { number: '', unit: defaultUnit, isValid: true };
  }

  if (schema.allowUnitless && NUMERIC_VALUE_REGEX.test(trimmed)) {
    return { number: trimmed, unit: '', isValid: true };
  }

  const units = schema.units || [];
  const match = trimmed.match(new RegExp(`^(-?(?:\\d+|\\d*\\.\\d+))(${units.map((unit) => unit.replace('%', '%')).join('|')})$`));
  if (!match) {
    return { number: trimmed, unit: defaultUnit, isValid: false };
  }

  return {
    number: match[1],
    unit: match[2],
    isValid: true,
  };
}

export function buildStructuredStyleValue(property: AllowedStyleKey, rawNumber: string, rawUnit: string): StyleValidationResult {
  const schema = getStyleSchema(property);
  const number = rawNumber.trim();
  const unit = rawUnit.trim();

  if (!number) {
    return {
      isValid: Boolean(schema.allowEmpty),
      normalizedValue: '',
      reason: schema.allowEmpty ? undefined : 'required',
    };
  }

  if (!NUMERIC_VALUE_REGEX.test(number)) {
    return { isValid: false, normalizedValue: `${number}${unit}`, reason: 'invalid-size' };
  }

  if (schema.allowUnitless && !unit) {
    return validateStyleValue(property, number);
  }

  return validateStyleValue(property, `${number}${unit}`);
}

export function isHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value.trim());
}
