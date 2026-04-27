import { describe, expect, it } from 'vitest';
import { ProjectService } from './projectService';

describe('ProjectService.validateProjectFile', () => {
  it('normalizes a current v2 project file with scoped stateful config', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-1',
        name: 'Landing',
        baseUrl: 'https://example.com/editor',
        siteKey: 'example-site',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      sourcePreview: {
        protocolVersion: 1,
        moduleVersion: '1.2.0',
        page: {
          url: 'https://example.com/editor/page',
          origin: 'https://example.com',
          title: 'Editor Page',
        },
        site: {
          siteKey: 'example-site',
          siteName: 'Example',
          environment: 'staging',
        },
        editable: {
          knownTargets: ['home.hero/home.title', 'layout.mainMenu/menu.option'],
          count: 2,
        },
        capturedAt: '2026-04-18T11:05:00.000Z',
      },
      config: {
        'home.hero/home.title': {
          default: {
            color: '#ff0000',
            fontSize: '48px',
          },
          hover: {
            color: '#0000ff',
          },
        },
      },
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.schemaVersion).toBe(2);
    expect(result.project).toEqual(input.project);
    expect(result.sourcePreview).toEqual(input.sourcePreview);
    expect(result.config).toEqual(input.config);
  });

  it('sanitizes config values while validating imported projects', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-unsafe',
        name: 'Unsafe Project',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'home.hero/home.title': {
          default: {
            color: '#ff0000',
            fontSize: '18px;',
            fontWeight: '700',
          },
        },
      },
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.config['home.hero/home.title']).toEqual({
      default: {
        color: '#ff0000',
        fontWeight: '700',
      },
    });
  });

  it('filters malformed knownTargets from sourcePreview metadata instead of rejecting the project', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-preview-metadata',
        name: 'Preview Metadata',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      sourcePreview: {
        protocolVersion: 1,
        page: {
          url: 'https://example.com/page',
          origin: 'https://example.com',
          title: 'Page',
        },
        editable: {
          knownTargets: ['home.hero/home.title', 'menu.option', 'layout.mainMenu/'],
          count: 3,
        },
        capturedAt: '2026-04-18T11:05:00.000Z',
      },
      config: {
        'home.hero/home.title': {
          default: { color: '#ff0000' },
        },
      },
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.sourcePreview?.editable?.knownTargets).toEqual(['home.hero/home.title']);
  });

  it('accepts selected and open semantic states in stateful config values', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-semantic-stateful',
        name: 'Semantic Stateful Project',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'tabs.main/tab.option': {
          default: { color: '#666666' },
          selected: { color: '#111111' },
        },
        'faq.list/accordion.trigger': {
          default: { color: '#222222' },
          open: { color: '#0055ff' },
        },
      },
    };

    expect(ProjectService.validateProjectFile(input).config).toEqual(input.config);
  });

  it('rejects plain config values', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-flat',
        name: 'Flat Config',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'layout.mainMenu/menu.option': {
          color: '#ff0000',
        },
      },
    };

    expect(() => ProjectService.validateProjectFile(input)).toThrow("Config d'estils no vàlida per al target layout.mainMenu/menu.option");
  });

  it('rejects config keys without scope', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-invalid-key',
        name: 'Invalid Target Key',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'menu.option': {
          default: { color: '#ff0000' },
        },
      },
    };

    expect(() => ProjectService.validateProjectFile(input)).toThrow('Canonical target key must use exactly one scope/target separator');
  });

  it('rejects malformed target keys', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-invalid-key-2',
        name: 'Invalid Target Key',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'layout.mainMenu/': {
          default: { color: '#ff0000' },
        },
      },
    };

    expect(() => ProjectService.validateProjectFile(input)).toThrow('Canonical target key must contain both scope and target');
  });

  it('rejects unsupported schema versions', () => {
    expect(() => ProjectService.validateProjectFile({ schemaVersion: 1, project: {}, config: {} })).toThrow('Versió d\'esquema no compatible');
    expect(() => ProjectService.validateProjectFile({ schemaVersion: 99, project: {}, config: {} })).toThrow('Versió d\'esquema no compatible');
  });

  it('parses valid project JSON text', () => {
    const raw = JSON.stringify({
      schemaVersion: 2,
      project: {
        projectId: 'project-json',
        name: 'JSON Project',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {
        'home.hero/home.title': {
          default: { color: '#ff0000' },
        },
      },
    });

    expect(ProjectService.parseProjectFileJson(raw).project.name).toBe('JSON Project');
  });

  it('throws a user-facing error for malformed project JSON text', () => {
    expect(() => ProjectService.parseProjectFileJson('{')).toThrow('Fitxer JSON no vàlid');
  });
});

describe('ProjectService.prepareForPersistence', () => {
  it('returns a normalized v2 export with refreshed updatedAt', () => {
    const project = {
      schemaVersion: 2,
      project: {
        projectId: 'project-persist',
        name: 'Persisted',
        baseUrl: 'https://example.com',
        siteKey: 'example-site',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {
        'home.hero/home.title': {
          default: {
            color: '#ff0000',
          },
        },
      },
    };

    const sourcePreview = {
      protocolVersion: 1,
      page: {
        url: 'https://example.com/home',
        origin: 'https://example.com',
      },
      editable: {
        knownTargets: ['home.hero/home.title'],
        count: 1,
      },
      capturedAt: '2026-04-18T12:00:00.000Z',
    };

    const result = ProjectService.prepareForPersistence(project, sourcePreview);

    expect(result.schemaVersion).toBe(2);
    expect(result.sourcePreview).toEqual({
      protocolVersion: 1,
      moduleVersion: undefined,
      page: {
        url: 'https://example.com/home',
        origin: 'https://example.com',
        title: '',
      },
      site: undefined,
      editable: {
        knownTargets: ['home.hero/home.title'],
        count: 1,
      },
      capturedAt: '2026-04-18T12:00:00.000Z',
    });
    expect(result.project.updatedAt).not.toBe('2026-04-18T10:00:00.000Z');
    expect(result.project.createdAt).toBe('2026-04-18T10:00:00.000Z');
  });

  it('preserves stateful scoped config format when persisting', () => {
    const project = {
      schemaVersion: 2,
      project: {
        projectId: 'project-stateful-persist',
        name: 'Stateful Persist',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {
        'layout.mainMenu/menu.option': {
          default: { color: '#ff0000' },
          hover: { color: '#0000ff' },
        },
      },
    };

    expect(ProjectService.prepareForPersistence(project).config).toEqual(project.config);
  });

  it('builds a sanitized export filename from siteKey or project name', () => {
    expect(ProjectService.buildExportFilename({
      schemaVersion: 2,
      project: {
        projectId: 'project-export',
        name: 'My Landing Page',
        siteKey: 'Example Site',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {},
    })).toMatch(/^example-site-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('normalizes imported style values with property-aware validation', () => {
    expect(ProjectService.sanitizeStyles({
      color: '#FF0000',
      fontSize: '16.0px',
      fontWeight: '700',
    })).toEqual({
      color: '#ff0000',
      fontSize: '16px',
      fontWeight: '700',
    });
  });

  it('updates the requested state using only the stateful scoped contract', () => {
    const config = {
      'layout.mainMenu/menu.option': {
        default: { color: '#000000' },
      },
    };

    expect(ProjectService.updateConfig(config, 'layout.mainMenu/menu.option', { color: '#ff0000' }, 'hover')).toEqual({
      'layout.mainMenu/menu.option': {
        default: { color: '#000000' },
        hover: { color: '#ff0000' },
      },
    });
  });

  it('removes only the active non-default state property without touching default', () => {
    const config = {
      'layout.mainMenu/menu.option': {
        default: { color: '#000000' },
        hover: { color: '#ff0000', fontSize: '18px' },
      },
    };

    expect(ProjectService.removeStylesFromConfig(config, 'layout.mainMenu/menu.option', ['color'], 'hover')).toEqual({
      'layout.mainMenu/menu.option': {
        default: { color: '#000000' },
        hover: { fontSize: '18px' },
      },
    });
  });

  it('copies default styles into a destination state and overwrites existing destination styles', () => {
    const statefulConfig = {
      'tabs.main/tab.option': {
        default: { color: '#000000', fontSize: '16px' },
        selected: { color: '#ff0000' },
      },
    };

    expect(ProjectService.copyStylesFromDefault(statefulConfig, 'tabs.main/tab.option', 'selected')).toEqual({
      'tabs.main/tab.option': {
        default: { color: '#000000', fontSize: '16px' },
        selected: { color: '#000000', fontSize: '16px' },
      },
    });
  });
});
