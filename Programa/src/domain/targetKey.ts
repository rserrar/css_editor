export interface ParsedTargetKey {
  scope: string | null;
  target: string;
  canonicalKey: string;
  hasScope: boolean;
}

function normalizePart(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildCanonicalKey(scope: string | null | undefined, target: string): string {
  const normalizedTarget = normalizePart(target);
  if (!normalizedTarget) {
    throw new Error('Target key requires a non-empty target');
  }

  const normalizedScope = normalizePart(scope);
  return normalizedScope ? `${normalizedScope}/${normalizedTarget}` : normalizedTarget;
}

export function parseCanonicalKey(key: string): ParsedTargetKey {
  const normalizedKey = normalizePart(key);
  if (!normalizedKey) {
    throw new Error('Target key requires a non-empty key');
  }

  const separatorIndex = normalizedKey.indexOf('/');
  if (separatorIndex === -1) {
    return {
      scope: null,
      target: normalizedKey,
      canonicalKey: normalizedKey,
      hasScope: false,
    };
  }

  const scope = normalizePart(normalizedKey.slice(0, separatorIndex));
  const target = normalizePart(normalizedKey.slice(separatorIndex + 1));
  if (!scope || !target) {
    throw new Error('Canonical target key must contain both scope and target');
  }

  return {
    scope,
    target,
    canonicalKey: `${scope}/${target}`,
    hasScope: true,
  };
}

export function getTargetFromKey(key: string): string {
  return parseCanonicalKey(key).target;
}

export function getScopeFromKey(key: string): string | null {
  return parseCanonicalKey(key).scope;
}

export function hasScopedTargetKey(key: string): boolean {
  return parseCanonicalKey(key).hasScope;
}

export function matchesTargetKey(input: string, scope: string | null | undefined, target: string): boolean {
  return buildCanonicalKey(scope, target) === parseCanonicalKey(input).canonicalKey;
}
