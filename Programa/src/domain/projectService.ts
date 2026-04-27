import { EditableStyleSet, ProjectFile, SourcePreview, StatefulStyleSet, StyleConfig } from './models';
import { parseCanonicalKey, tryParseCanonicalKey } from './targetKey';
import { copyStateFromDefault, createEmptyStatefulStyleSet, isStatefulStyle, removeFromState, RUNTIME_STYLE_STATES, RuntimeStyleState, updateStateStyles } from './styleStateHelpers';
import { validateStyleValue } from './styleValidators';

const CURRENT_SCHEMA_VERSION = 2;

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeKnownTargets(targets: unknown): string[] | undefined {
  if (!Array.isArray(targets)) return undefined;

  return targets
    .map((target) => tryParseCanonicalKey(asString(target))?.canonicalKey)
    .filter((target): target is string => Boolean(target));
}

function normalizeSourcePreview(sourcePreview: unknown, fallbackCapturedAt: string): SourcePreview | undefined {
  if (!isRecord(sourcePreview) || typeof sourcePreview.protocolVersion !== 'number') return undefined;

  const page = isRecord(sourcePreview.page) ? sourcePreview.page : {};
  const site = isRecord(sourcePreview.site) ? sourcePreview.site : undefined;
  const editable = isRecord(sourcePreview.editable) ? sourcePreview.editable : undefined;

  return {
    protocolVersion: sourcePreview.protocolVersion,
    moduleVersion: asString(sourcePreview.moduleVersion) || undefined,
    page: {
      url: asString(page.url),
      origin: asString(page.origin),
      title: asString(page.title),
    },
    site: site
      ? {
          siteKey: asString(site.siteKey),
          siteName: asString(site.siteName),
          environment: asString(site.environment) || undefined,
        }
      : undefined,
    editable: editable
      ? {
          knownTargets: normalizeKnownTargets(editable.knownTargets),
          count: typeof editable.count === 'number' ? editable.count : undefined,
        }
      : undefined,
    capturedAt: asString(sourcePreview.capturedAt, fallbackCapturedAt),
  };
}

function normalizeStyleConfig(config: unknown): StyleConfig {
  if (!isRecord(config)) return {};

  const normalized: StyleConfig = {};
  for (const [target, styles] of Object.entries(config)) {
    const normalizedTarget = parseCanonicalKey(target).canonicalKey;
    if (!isStatefulStyle(styles)) {
      throw new Error(`Config d'estils no vàlida per al target ${normalizedTarget}`);
    }

    const normalizedStates = createEmptyStatefulStyleSet();
    for (const state of RUNTIME_STYLE_STATES) {
      if (styles[state]) {
        normalizedStates[state] = ProjectService.sanitizeStyles(styles[state] as EditableStyleSet);
      }
    }

    normalized[normalizedTarget] = normalizedStates;
  }

  return normalized;
}

function slugifyFilenamePart(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return 'projecte';

  return trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'projecte';
}

export const ProjectService = {
  currentSchemaVersion: CURRENT_SCHEMA_VERSION,

  createEmptyProject(baseUrl?: string): ProjectFile {
    const timestamp = new Date().toISOString();

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      project: {
        projectId: crypto.randomUUID(),
        name: 'Projecte sense títol',
        baseUrl: baseUrl || '',
        siteKey: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      config: {},
    };
  },

  attachSourcePreview(project: ProjectFile, sourcePreview: SourcePreview): ProjectFile {
    return {
      ...project,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      project: {
        ...project.project,
        baseUrl: project.project.baseUrl || sourcePreview.page.url,
        siteKey: project.project.siteKey || sourcePreview.site?.siteKey || '',
        updatedAt: new Date().toISOString(),
      },
      sourcePreview,
    };
  },

  prepareForPersistence(project: ProjectFile, sourcePreview?: SourcePreview): ProjectFile {
    const normalized = this.validateProjectFile({
      ...project,
      sourcePreview: sourcePreview ?? project.sourcePreview,
    });

    return {
      ...normalized,
      project: {
        ...normalized.project,
        updatedAt: new Date().toISOString(),
      },
    };
  },

  validateProjectFile(data: unknown): ProjectFile {
    if (!isRecord(data) || !isRecord(data.project) || !isRecord(data.config)) {
      throw new Error('Estructura de fitxer no vàlida');
    }

    const schemaVersion = typeof data.schemaVersion === 'number' ? data.schemaVersion : CURRENT_SCHEMA_VERSION;
    if (schemaVersion !== CURRENT_SCHEMA_VERSION) {
      throw new Error('Versió d\'esquema no compatible');
    }

    const now = new Date().toISOString();
    const project = data.project;
    const createdAt = asString(project.createdAt, now);
    const updatedAt = asString(project.updatedAt, createdAt);

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      project: {
        projectId: asString(project.projectId, crypto.randomUUID()),
        name: asString(project.name, 'Projecte sense títol'),
        baseUrl: asString(project.baseUrl),
        siteKey: asString(project.siteKey),
        createdAt,
        updatedAt,
      },
      sourcePreview: normalizeSourcePreview(data.sourcePreview, updatedAt),
      config: normalizeStyleConfig(data.config),
    };
  },

  parseProjectFileJson(raw: string): ProjectFile {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Fitxer JSON no vàlid');
    }

    return this.validateProjectFile(parsed);
  },

  buildExportFilename(project: ProjectFile): string {
    const baseName = project.project.siteKey || project.project.name || 'projecte';
    const datePart = new Date().toISOString().split('T')[0];
    return `${slugifyFilenamePart(baseName)}-${datePart}.json`;
  },

  sanitizeStyles(styles: EditableStyleSet): EditableStyleSet {
    const clean: EditableStyleSet = {};

    for (const [key, value] of Object.entries(styles)) {
      const property = key as keyof EditableStyleSet;
      const val = value as string;
      if (!val) continue;

      const result = validateStyleValue(property, val);
      if (result.isValid) {
        clean[property] = result.normalizedValue;
      } else {
        console.warn(`Valor no vàlid detectat i bloquejat per la propietat ${key}: ${val}`);
      }
    }

    return clean;
  },

  updateConfig(config: StyleConfig, target: string, styles: EditableStyleSet, state: RuntimeStyleState = 'default'): StyleConfig {
    const sanitized = this.sanitizeStyles(styles);
    const canonicalTarget = parseCanonicalKey(target).canonicalKey;
    return {
      ...config,
      [canonicalTarget]: updateStateStyles(config[canonicalTarget], state, sanitized),
    };
  },

  removeStylesFromConfig(config: StyleConfig, target: string, keys: string[], state: RuntimeStyleState = 'default'): StyleConfig {
    const canonicalTarget = parseCanonicalKey(target).canonicalKey;
    if (!config[canonicalTarget]) return config;
    const newTargetConfig = removeFromState(config[canonicalTarget], state, keys as any);

    return {
      ...config,
      [canonicalTarget]: newTargetConfig || createEmptyStatefulStyleSet(),
    };
  },

  copyStylesFromDefault(config: StyleConfig, target: string, destinationState: RuntimeStyleState): StyleConfig {
    const canonicalTarget = parseCanonicalKey(target).canonicalKey;
    return {
      ...config,
      [canonicalTarget]: copyStateFromDefault(config[canonicalTarget], destinationState),
    };
  },
};
