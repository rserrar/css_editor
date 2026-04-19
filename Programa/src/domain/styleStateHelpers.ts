import { ALLOWED_CSS_PROPERTIES, AllowedStyleKey, EditableStyleSet, StatefulStyleSet, StyleConfigValue } from './models';

export const RUNTIME_STYLE_STATES = ['default', 'hover', 'focus', 'active', 'disabled', 'selected', 'open'] as const;
export type RuntimeStyleState = (typeof RUNTIME_STYLE_STATES)[number];

const ALLOWED_PROPERTY_SET = new Set<string>(ALLOWED_CSS_PROPERTIES);
const ALLOWED_STATE_SET = new Set<string>(RUNTIME_STYLE_STATES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isEditableStyleSet(value: unknown): value is EditableStyleSet {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.every((key) => ALLOWED_PROPERTY_SET.has(key));
}

export function isStatefulStyle(value: unknown): value is StatefulStyleSet {
  if (!isRecord(value)) return false;

  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  if (!keys.every((key) => ALLOWED_STATE_SET.has(key))) return false;

  return keys.every((key) => isEditableStyleSet(value[key]));
}

export function normalizeToStateful(value: StyleConfigValue): StatefulStyleSet {
  if (isStatefulStyle(value)) {
    return value;
  }

  return {
    default: isEditableStyleSet(value) ? value : {},
  };
}

export function getStateStyles(value: StyleConfigValue | undefined, state: RuntimeStyleState): EditableStyleSet {
  if (!value) return {};
  const normalized = normalizeToStateful(value);
  return normalized[state] || {};
}

export function getDefinedStates(value: StyleConfigValue | undefined): RuntimeStyleState[] {
  if (!value) return [];
  const normalized = normalizeToStateful(value);
  return RUNTIME_STYLE_STATES.filter((state) => normalized[state] && Object.keys(normalized[state] || {}).length > 0);
}

export function updateDefaultState(value: StyleConfigValue | undefined, patch: EditableStyleSet): StyleConfigValue {
  if (!value || isEditableStyleSet(value)) {
    return {
      ...(isEditableStyleSet(value) ? value : {}),
      ...patch,
    };
  }

  return {
    ...value,
    default: {
      ...(value.default || {}),
      ...patch,
    },
  };
}

export function updateStateStyles(value: StyleConfigValue | undefined, state: RuntimeStyleState, patch: EditableStyleSet): StyleConfigValue {
  if (state === 'default') {
    return updateDefaultState(value, patch);
  }

  const normalized = normalizeToStateful(value || {});
  return {
    ...normalized,
    [state]: {
      ...(normalized[state] || {}),
      ...patch,
    },
  };
}

export function removeFromDefaultState(value: StyleConfigValue | undefined, keys: AllowedStyleKey[]): StyleConfigValue | undefined {
  if (!value) return undefined;

  if (isEditableStyleSet(value)) {
    const next = { ...value };
    keys.forEach((key) => delete next[key]);
    return next;
  }

  const nextDefault = { ...(value.default || {}) };
  keys.forEach((key) => delete nextDefault[key]);
  return {
    ...value,
    default: nextDefault,
  };
}

export function removeFromState(value: StyleConfigValue | undefined, state: RuntimeStyleState, keys: AllowedStyleKey[]): StyleConfigValue | undefined {
  if (!value) return undefined;
  if (state === 'default') {
    return removeFromDefaultState(value, keys);
  }

  const normalized = normalizeToStateful(value);
  const nextState = { ...(normalized[state] || {}) };
  keys.forEach((key) => delete nextState[key]);

  return {
    ...normalized,
    [state]: nextState,
  };
}

export function copyStateFromDefault(value: StyleConfigValue | undefined, destinationState: RuntimeStyleState): StyleConfigValue {
  if (destinationState === 'default') {
    return value && isStatefulStyle(value) ? value : normalizeToStateful(value || {});
  }

  const normalized = normalizeToStateful(value || {});
  return {
    ...normalized,
    [destinationState]: {
      ...(normalized.default || {}),
    },
  };
}

export function canUseIncrementalDefaultMessages(value: StyleConfigValue | undefined, state: RuntimeStyleState): boolean {
  return state === 'default' && (!value || isEditableStyleSet(value));
}
