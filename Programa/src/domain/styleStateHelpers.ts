import { ALLOWED_CSS_PROPERTIES, AllowedStyleKey, EditableStyleSet, StatefulStyleSet } from './models';

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
  if (keys.length === 0 || !keys.includes('default')) return false;
  if (!keys.every((key) => ALLOWED_STATE_SET.has(key))) return false;

  return keys.every((key) => isEditableStyleSet(value[key]));
}

export function createEmptyStatefulStyleSet(): StatefulStyleSet {
  return {
    default: {},
  };
}

export function getStateStyles(value: StatefulStyleSet | undefined, state: RuntimeStyleState): EditableStyleSet {
  if (!value) return {};
  return value[state] || {};
}

export function getDefinedStates(value: StatefulStyleSet | undefined): RuntimeStyleState[] {
  if (!value) return [];
  return RUNTIME_STYLE_STATES.filter((state) => Object.keys(value[state] || {}).length > 0);
}

export function updateDefaultState(value: StatefulStyleSet | undefined, patch: EditableStyleSet): StatefulStyleSet {
  const nextValue = value ?? createEmptyStatefulStyleSet();
  return {
    ...nextValue,
    default: {
      ...(nextValue.default || {}),
      ...patch,
    },
  };
}

export function updateStateStyles(value: StatefulStyleSet | undefined, state: RuntimeStyleState, patch: EditableStyleSet): StatefulStyleSet {
  if (state === 'default') {
    return updateDefaultState(value, patch);
  }

  const normalized = value ?? createEmptyStatefulStyleSet();
  return {
    ...normalized,
    [state]: {
      ...(normalized[state] || {}),
      ...patch,
    },
  };
}

export function removeFromDefaultState(value: StatefulStyleSet | undefined, keys: AllowedStyleKey[]): StatefulStyleSet | undefined {
  if (!value) return undefined;

  const nextDefault = { ...(value.default || {}) };
  keys.forEach((key) => delete nextDefault[key]);
  return {
    ...value,
    default: nextDefault,
  };
}

export function removeFromState(value: StatefulStyleSet | undefined, state: RuntimeStyleState, keys: AllowedStyleKey[]): StatefulStyleSet | undefined {
  if (!value) return undefined;
  if (state === 'default') {
    return removeFromDefaultState(value, keys);
  }

  const normalized = value;
  const nextState = { ...(normalized[state] || {}) };
  keys.forEach((key) => delete nextState[key]);

  return {
    ...normalized,
    [state]: nextState,
  };
}

export function copyStateFromDefault(value: StatefulStyleSet | undefined, destinationState: RuntimeStyleState): StatefulStyleSet {
  const normalized = value ?? createEmptyStatefulStyleSet();

  if (destinationState === 'default') {
    return normalized;
  }

  return {
    ...normalized,
    [destinationState]: {
      ...(normalized.default || {}),
    },
  };
}
