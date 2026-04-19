import { EditableStyleSet, LegacySourcePreview, ProjectFile, SourcePreview, StatefulStyleSet, StyleConfig, StyleConfigValue } from './models';
import { parseCanonicalKey } from './targetKey';
import { copyStateFromDefault, isEditableStyleSet, isStatefulStyle, removeFromState, RuntimeStyleState, updateStateStyles } from './styleStateHelpers';

const CURRENT_SCHEMA_VERSION = 2;
const SAFE_CSS_VALUE_REGEX = /^[a-zA-Z0-9\s.,#%()\-!]+$/;

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeStyleConfig(config: unknown): StyleConfig {
  if (!isRecord(config)) return {};

  const normalized: StyleConfig = {};
  for (const [target, styles] of Object.entries(config)) {
    const normalizedTarget = parseCanonicalKey(target).canonicalKey;
    if (!isRecord(styles)) continue;

    if (isEditableStyleSet(styles)) {
      normalized[normalizedTarget] = ProjectService.sanitizeStyles(styles as EditableStyleSet);
      continue;
    }

    if (isStatefulStyle(styles)) {
      const normalizedStates: StatefulStyleSet = {};
      for (const [state, stateStyles] of Object.entries(styles)) {
        normalizedStates[state as keyof StatefulStyleSet] = ProjectService.sanitizeStyles(stateStyles as EditableStyleSet);
      }
      normalized[normalizedTarget] = normalizedStates;
      continue;
    }

    throw new Error(`Config d'estils no vàlida per al target ${normalizedTarget}`);
  }

  return normalized;
}

function normalizeLegacySourcePreview(sourcePreview: LegacySourcePreview | SourcePreview | undefined, fallbackCapturedAt: string): SourcePreview | undefined {
  if (!sourcePreview || typeof sourcePreview.protocolVersion !== 'number') return undefined;

  if ('page' in sourcePreview) {
    return {
      protocolVersion: sourcePreview.protocolVersion,
      moduleVersion: sourcePreview.moduleVersion,
      page: {
        url: asString(sourcePreview.page?.url),
        origin: asString(sourcePreview.page?.origin),
        title: asString(sourcePreview.page?.title),
      },
      site: sourcePreview.site
        ? {
            siteKey: asString(sourcePreview.site.siteKey),
            siteName: asString(sourcePreview.site.siteName),
            environment: asString(sourcePreview.site.environment),
          }
        : undefined,
      editable: sourcePreview.editable
        ? {
            knownTargets: Array.isArray(sourcePreview.editable.knownTargets) ? sourcePreview.editable.knownTargets.filter((item): item is string => typeof item === 'string') : undefined,
            count: typeof sourcePreview.editable.count === 'number' ? sourcePreview.editable.count : undefined,
          }
        : undefined,
      capturedAt: asString(sourcePreview.capturedAt, fallbackCapturedAt),
    };
  }

  const legacy = sourcePreview as LegacySourcePreview;
  const knownTargets = Array.isArray(legacy.knownTargets)
    ? legacy.knownTargets.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    protocolVersion: legacy.protocolVersion,
    moduleVersion: legacy.moduleVersion,
    page: {
      url: asString(legacy.url),
      origin: asString(legacy.origin),
      title: asString(legacy.title),
    },
    site: legacy.siteKey || legacy.siteName
      ? {
          siteKey: asString(legacy.siteKey),
          siteName: asString(legacy.siteName),
        }
      : undefined,
    editable: {
      knownTargets,
      count: knownTargets.length,
    },
    capturedAt: fallbackCapturedAt,
  };
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

    const schemaVersion = typeof data.schemaVersion === 'number' ? data.schemaVersion : 1;
    if (![1, CURRENT_SCHEMA_VERSION].includes(schemaVersion)) {
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
      sourcePreview: normalizeLegacySourcePreview(data.sourcePreview as LegacySourcePreview | SourcePreview | undefined, updatedAt),
      config: normalizeStyleConfig(data.config),
    };
  },

  sanitizeStyles(styles: EditableStyleSet): EditableStyleSet {
    const clean: EditableStyleSet = {};

    for (const [key, value] of Object.entries(styles)) {
      const val = value as string;
      if (val && SAFE_CSS_VALUE_REGEX.test(val)) {
        clean[key as keyof EditableStyleSet] = val;
      } else if (val) {
        console.warn(`Valor insegur detectat i bloquejat per la propietat ${key}: ${val}`);
      }
    }

    return clean;
  },

  updateConfig(config: StyleConfig, target: string, styles: EditableStyleSet, state: RuntimeStyleState = 'default'): StyleConfig {
    const sanitized = this.sanitizeStyles(styles);
    return {
      ...config,
      [target]: updateStateStyles(config[target], state, sanitized),
    };
  },

  removeStylesFromConfig(config: StyleConfig, target: string, keys: string[], state: RuntimeStyleState = 'default'): StyleConfig {
    if (!config[target]) return config;
    const newTargetConfig = removeFromState(config[target], state, keys as any);

    return {
      ...config,
      [target]: newTargetConfig || {},
    };
  },

  copyStylesFromDefault(config: StyleConfig, target: string, destinationState: RuntimeStyleState): StyleConfig {
    return {
      ...config,
      [target]: copyStateFromDefault(config[target], destinationState),
    };
  },
};
