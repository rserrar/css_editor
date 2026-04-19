import type { StyleConfig } from './style-schema';

export function camelToKebab(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

export function renderStyles(config: StyleConfig): string {
  let css = '';

  for (const [target, styles] of Object.entries(config)) {
    const declarations = Object.entries(styles)
      .filter(([, value]) => typeof value === 'string' && value.length > 0)
      .map(([key, value]) => `  ${camelToKebab(key)}: ${value};`)
      .join('\n');

    if (!declarations) continue;

    css += `[data-editable="${target}"] {\n${declarations}\n}\n\n`;
  }

  return css;
}

export function upsertLiveStyleTag(css: string, id = 'live-editor-styles'): void {
  let styleEl = document.getElementById(id) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = id;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = css;
}
