import { AllowedStyleKey } from './models';

export type StylePropertyType = 'color' | 'size' | 'spacing' | 'select' | 'text';

export interface StylePropertySchema {
  type: StylePropertyType;
  units?: string[];
  options?: string[];
  allowEmpty?: boolean;
  defaultValue?: string;
  allowUnitless?: boolean;
  allowNegative?: boolean;
}

export const STYLE_SCHEMA: Record<AllowedStyleKey, StylePropertySchema> = {
  fontFamily: {
    type: 'select',
    options: ['Arial', 'Inter', 'Montserrat', 'Suisse Intl', 'Avenir LT Std', 'sans-serif', 'serif', 'monospace'],
    allowEmpty: true,
  },
  fontSize: { type: 'size', units: ['px', 'rem', 'em'], defaultValue: '16px' },
  fontWeight: { type: 'select', options: ['400', '500', '600', '700'], allowEmpty: true },
  fontStyle: { type: 'select', options: ['normal', 'italic', 'oblique'], allowEmpty: true },
  textAlign: { type: 'select', options: ['left', 'center', 'right', 'justify', 'start', 'end'], allowEmpty: true },
  textTransform: { type: 'select', options: ['none', 'uppercase', 'lowercase', 'capitalize'], allowEmpty: true },
  textDecoration: { type: 'select', options: ['none', 'underline', 'line-through', 'overline'], allowEmpty: true },
  lineHeight: { type: 'size', units: ['px', 'rem', 'em'], allowUnitless: true, defaultValue: '1.5' },
  letterSpacing: { type: 'size', units: ['px', 'em'], allowNegative: true, allowUnitless: true, defaultValue: '0' },
  color: { type: 'color', allowEmpty: true, defaultValue: '#000000' },
  backgroundColor: { type: 'color', allowEmpty: true, defaultValue: '#ffffff' },
  backgroundSize: { type: 'select', options: ['auto', 'cover', 'contain'], allowEmpty: true },
  backgroundPosition: {
    type: 'select',
    options: ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'],
    allowEmpty: true,
  },
  backgroundRepeat: { type: 'select', options: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round'], allowEmpty: true },
  marginTop: { type: 'spacing', units: ['px', 'rem', '%'], allowNegative: true, defaultValue: '0px' },
  marginBottom: { type: 'spacing', units: ['px', 'rem', '%'], allowNegative: true, defaultValue: '0px' },
  marginLeft: { type: 'spacing', units: ['px', 'rem', '%'], allowNegative: true, defaultValue: '0px' },
  marginRight: { type: 'spacing', units: ['px', 'rem', '%'], allowNegative: true, defaultValue: '0px' },
  paddingTop: { type: 'spacing', units: ['px', 'rem', '%'], defaultValue: '0px' },
  paddingBottom: { type: 'spacing', units: ['px', 'rem', '%'], defaultValue: '0px' },
  paddingLeft: { type: 'spacing', units: ['px', 'rem', '%'], defaultValue: '0px' },
  paddingRight: { type: 'spacing', units: ['px', 'rem', '%'], defaultValue: '0px' },
  borderColor: { type: 'color', allowEmpty: true, defaultValue: '#d1d5db' },
  borderWidth: { type: 'size', units: ['px', 'rem'], defaultValue: '1px' },
  borderRadius: { type: 'size', units: ['px', '%'], defaultValue: '0px' },
  objectFit: { type: 'select', options: ['fill', 'contain', 'cover', 'none', 'scale-down'], allowEmpty: true },
  objectPosition: {
    type: 'select',
    options: ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'],
    allowEmpty: true,
  },
};

export function getStyleSchema(property: AllowedStyleKey): StylePropertySchema {
  return STYLE_SCHEMA[property];
}
