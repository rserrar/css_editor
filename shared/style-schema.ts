export const ALLOWED_STYLE_KEYS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'color',
  'backgroundColor',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'borderColor',
  'borderWidth',
  'borderRadius',
] as const;

export type AllowedStyleKey = (typeof ALLOWED_STYLE_KEYS)[number];

export type EditableStyleSet = Partial<Record<AllowedStyleKey, string>>;
export type StyleConfig = Record<string, EditableStyleSet>;

export function sanitizeStyleSet(input: Record<string, string>): EditableStyleSet {
  const output: EditableStyleSet = {};

  for (const key of ALLOWED_STYLE_KEYS) {
    if (typeof input[key] === 'string') {
      output[key] = input[key];
    }
  }

  return output;
}
