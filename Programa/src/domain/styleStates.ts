import { EditableStyleSet } from './models';

export const DEFAULT_STYLE_STATE = 'default' as const;

export const STYLE_STATE_IDS = [
  DEFAULT_STYLE_STATE,
  'hover',
  'focus',
  'active',
  'disabled',
  'selected',
  'open',
  'expanded',
  'current',
  'checked',
] as const;

export type StyleStateId = (typeof STYLE_STATE_IDS)[number];
export type StyleStateCategory = 'css' | 'semantic';

export interface StyleStateDefinition {
  id: StyleStateId;
  category: StyleStateCategory;
  label: string;
  selectorHint?: string;
  domSignals?: string[];
}

export type StatefulStyleConfig = Record<string, Partial<Record<StyleStateId, EditableStyleSet>>>;

export const STYLE_STATE_DEFINITIONS: Record<StyleStateId, StyleStateDefinition> = {
  default: {
    id: 'default',
    category: 'css',
    label: 'Default',
  },
  hover: {
    id: 'hover',
    category: 'css',
    label: 'Hover',
    selectorHint: ':hover',
  },
  focus: {
    id: 'focus',
    category: 'css',
    label: 'Focus',
    selectorHint: ':focus',
  },
  active: {
    id: 'active',
    category: 'css',
    label: 'Active',
    selectorHint: ':active',
  },
  disabled: {
    id: 'disabled',
    category: 'css',
    label: 'Disabled',
    selectorHint: ':disabled',
    domSignals: ['disabled', 'aria-disabled="true"'],
  },
  selected: {
    id: 'selected',
    category: 'semantic',
    label: 'Selected',
    domSignals: ['aria-selected="true"', 'data-state="selected"'],
  },
  open: {
    id: 'open',
    category: 'semantic',
    label: 'Open',
    domSignals: ['data-state="open"', 'aria-expanded="true"'],
  },
  expanded: {
    id: 'expanded',
    category: 'semantic',
    label: 'Expanded',
    domSignals: ['aria-expanded="true"'],
  },
  current: {
    id: 'current',
    category: 'semantic',
    label: 'Current',
    domSignals: ['aria-current'],
  },
  checked: {
    id: 'checked',
    category: 'semantic',
    label: 'Checked',
    domSignals: ['checked', 'aria-checked="true"', 'data-state="checked"'],
  },
};

export function isStyleStateId(value: string): value is StyleStateId {
  return STYLE_STATE_IDS.includes(value as StyleStateId);
}

export function getStyleStateDefinition(state: StyleStateId): StyleStateDefinition {
  return STYLE_STATE_DEFINITIONS[state];
}

export function isSemanticStyleState(state: StyleStateId): boolean {
  return STYLE_STATE_DEFINITIONS[state].category === 'semantic';
}

export function isCssStyleState(state: StyleStateId): boolean {
  return STYLE_STATE_DEFINITIONS[state].category === 'css';
}
