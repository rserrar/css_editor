export interface ParsedTargetKey {
  scope: string;
  target: string;
  canonicalKey: string;
}

function normalizePart(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildCanonicalKey(scope: string, target: string): string {
  const normalizedScope = normalizePart(scope);
  const normalizedTarget = normalizePart(target);
  if (!normalizedScope) {
    throw new Error('Target key requires a non-empty scope');
  }
  if (!normalizedTarget) {
    throw new Error('Target key requires a non-empty target');
  }

  if (normalizedScope.includes('/') || normalizedTarget.includes('/')) {
    throw new Error('Canonical target key must use exactly one scope/target separator');
  }

  return `${normalizedScope}/${normalizedTarget}`;
}

export function parseCanonicalKey(key: string): ParsedTargetKey {
  const normalizedKey = normalizePart(key);
  if (!normalizedKey) {
    throw new Error('Target key requires a non-empty key');
  }

  const parts = normalizedKey.split('/');
  if (parts.length !== 2) {
    throw new Error('Canonical target key must use exactly one scope/target separator');
  }

  const scope = normalizePart(parts[0]);
  const target = normalizePart(parts[1]);
  if (!scope || !target) {
    throw new Error('Canonical target key must contain both scope and target');
  }

  return {
    scope,
    target,
    canonicalKey: `${scope}/${target}`,
  };
}

export function tryParseCanonicalKey(key: string): ParsedTargetKey | null {
  try {
    return parseCanonicalKey(key);
  } catch {
    return null;
  }
}

export function getTargetFromKey(key: string): string {
  return parseCanonicalKey(key).target;
}

export function getScopeFromKey(key: string): string {
  return parseCanonicalKey(key).scope;
}

export function matchesTargetKey(input: string, scope: string, target: string): boolean {
  return buildCanonicalKey(scope, target) === parseCanonicalKey(input).canonicalKey;
}
