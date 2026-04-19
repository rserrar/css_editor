import { describe, expect, it } from 'vitest';
import { ProjectService } from './projectService';

describe('ProjectService.validateProjectFile', () => {
  it('normalizes a current v2 project file', () => {
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
          knownTargets: ['hero.title', 'hero.button'],
          count: 2,
        },
        capturedAt: '2026-04-18T11:05:00.000Z',
      },
      config: {
        'hero.title': {
          color: '#ff0000',
          fontSize: '48px',
        },
      },
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.schemaVersion).toBe(2);
    expect(result.project).toEqual(input.project);
    expect(result.sourcePreview).toEqual(input.sourcePreview);
    expect(result.config).toEqual(input.config);
  });

  it('migrates a legacy v1 sourcePreview shape into the new structure', () => {
    const input = {
      schemaVersion: 1,
      project: {
        projectId: 'legacy-project',
        name: 'Legacy',
        baseUrl: 'https://legacy.example.com',
        siteKey: 'legacy-site',
        createdAt: '2026-04-17T08:00:00.000Z',
        updatedAt: '2026-04-17T09:00:00.000Z',
      },
      sourcePreview: {
        protocolVersion: 1,
        moduleVersion: '1.0.0',
        url: 'https://legacy.example.com/page',
        origin: 'https://legacy.example.com',
        title: 'Legacy Page',
        siteKey: 'legacy-site',
        siteName: 'Legacy Site',
        knownTargets: ['hero.title', 'hero.subtitle'],
      },
      config: {
        'hero.title': {
          color: '#111111',
        },
      },
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.schemaVersion).toBe(2);
    expect(result.sourcePreview).toEqual({
      protocolVersion: 1,
      moduleVersion: '1.0.0',
      page: {
        url: 'https://legacy.example.com/page',
        origin: 'https://legacy.example.com',
        title: 'Legacy Page',
      },
      site: {
        siteKey: 'legacy-site',
        siteName: 'Legacy Site',
      },
      editable: {
        knownTargets: ['hero.title', 'hero.subtitle'],
        count: 2,
      },
      capturedAt: '2026-04-17T09:00:00.000Z',
    });
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
        'hero.title': {
          color: '#ff0000',
          fontSize: '18px;',
          fontWeight: '700',
        },
      },
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.config['hero.title']).toEqual({
      color: '#ff0000',
      fontWeight: '700',
    });
  });

  it('accepts scoped config keys and preserves them on import', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-scoped',
        name: 'Scoped Project',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'layout.mainMenu/menu.option': {
          color: '#ff0000',
        },
      },
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.config).toEqual({
      'layout.mainMenu/menu.option': {
        color: '#ff0000',
      },
    });
  });

  it('accepts stateful config values and preserves them on import', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-stateful',
        name: 'Stateful Project',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'button.primary': {
          default: { color: '#ff0000' },
          hover: { color: '#0000ff' },
        },
      },
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.config).toEqual({
      'button.primary': {
        default: { color: '#ff0000' },
        hover: { color: '#0000ff' },
      },
    });
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

    const result = ProjectService.validateProjectFile(input);

    expect(result.config).toEqual(input.config);
  });

  it('rejects malformed target keys', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-invalid-key',
        name: 'Invalid Target Key',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'layout.mainMenu/': {
          color: '#ff0000',
        },
      },
    };

    expect(() => ProjectService.validateProjectFile(input)).toThrow('Canonical target key must contain both scope and target');
  });

  it('rejects hybrid stateful config values', () => {
    const input = {
      schemaVersion: 2,
      project: {
        projectId: 'project-invalid-style-shape',
        name: 'Invalid Style Shape',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'button.primary': {
          color: '#ff0000',
          hover: { color: '#0000ff' },
        },
      },
    };

    expect(() => ProjectService.validateProjectFile(input)).toThrow("Config d'estils no vàlida per al target button.primary");
  });

  it('fills missing optional fields with stable defaults', () => {
    const input = {
      project: {
        projectId: 'project-minimal',
        name: 'Minimal Project',
      },
      config: {},
    };

    const result = ProjectService.validateProjectFile(input);

    expect(result.schemaVersion).toBe(2);
    expect(result.project.baseUrl).toBe('');
    expect(result.project.siteKey).toBe('');
    expect(result.project.createdAt).toBeTruthy();
    expect(result.project.updatedAt).toBeTruthy();
  });

  it('throws on invalid structures and unsupported schema versions', () => {
    expect(() => ProjectService.validateProjectFile(null)).toThrow('Estructura de fitxer no vàlida');
    expect(() => ProjectService.validateProjectFile({ schemaVersion: 2, project: {}, config: [] })).toThrow('Estructura de fitxer no vàlida');
    expect(() => ProjectService.validateProjectFile({ schemaVersion: 99, project: {}, config: {} })).toThrow('Versió d\'esquema no compatible');
  });
});

describe('ProjectService.prepareForPersistence', () => {
  it('returns a normalized v2 export with refreshed updatedAt', () => {
    const project = {
      schemaVersion: 1,
      project: {
        projectId: 'project-persist',
        name: 'Persisted',
        baseUrl: 'https://example.com',
        siteKey: 'example-site',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {
        'hero.title': {
          color: '#ff0000',
        },
      },
    };

    const sourcePreview = {
      protocolVersion: 1,
      page: {
        url: 'https://example.com/home',
        origin: 'https://example.com',
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
      editable: undefined,
      capturedAt: '2026-04-18T12:00:00.000Z',
    });
    expect(result.project.updatedAt).not.toBe('2026-04-18T10:00:00.000Z');
    expect(result.project.createdAt).toBe('2026-04-18T10:00:00.000Z');
  });

  it('preserves legacy and scoped keys exactly when persisting', () => {
    const project = {
      schemaVersion: 2,
      project: {
        projectId: 'project-key-preservation',
        name: 'Key Preservation',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {
        'menu.option': {
          color: '#111111',
        },
        'layout.mainMenu/menu.option': {
          fontSize: '18px',
        },
      },
    };

    const result = ProjectService.prepareForPersistence(project);

    expect(Object.keys(result.config)).toEqual(['menu.option', 'layout.mainMenu/menu.option']);
  });

  it('preserves stateful config format when persisting', () => {
    const project = {
      schemaVersion: 2,
      project: {
        projectId: 'project-stateful-persist',
        name: 'Stateful Persist',
        createdAt: '2026-04-18T10:00:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
      },
      config: {
        'button.primary': {
          default: { color: '#ff0000' },
          hover: { color: '#0000ff' },
        },
      },
    };

    const result = ProjectService.prepareForPersistence(project);

    expect(result.config).toEqual({
      'button.primary': {
        default: { color: '#ff0000' },
        hover: { color: '#0000ff' },
      },
    });
  });

  it('converts legacy config to stateful only when updating a non-default state', () => {
    const config = {
      'button.primary': {
        color: '#000000',
      },
    };

    const result = ProjectService.updateConfig(config, 'button.primary', { color: '#ff0000' }, 'hover');

    expect(result).toEqual({
      'button.primary': {
        default: { color: '#000000' },
        hover: { color: '#ff0000' },
      },
    });

    expect(ProjectService.updateConfig(config, 'button.primary', { fontWeight: '700' }, 'selected')).toEqual({
      'button.primary': {
        default: { color: '#000000' },
        selected: { fontWeight: '700' },
      },
    });

    expect(ProjectService.updateConfig(config, 'button.primary', { color: '#0055ff' }, 'open')).toEqual({
      'button.primary': {
        default: { color: '#000000' },
        open: { color: '#0055ff' },
      },
    });
  });

  it('removes only the active non-default state property without touching default', () => {
    const config = {
      'button.primary': {
        default: { color: '#000000' },
        hover: { color: '#ff0000', fontSize: '18px' },
      },
    };

    const result = ProjectService.removeStylesFromConfig(config, 'button.primary', ['color'], 'hover');

    expect(result).toEqual({
      'button.primary': {
        default: { color: '#000000' },
        hover: { fontSize: '18px' },
      },
    });

    const semanticConfig = {
      'tabs.main/tab.option': {
        default: { color: '#666666' },
        selected: { color: '#111111', fontWeight: '700' },
      },
    };

    expect(ProjectService.removeStylesFromConfig(semanticConfig, 'tabs.main/tab.option', ['color'], 'selected')).toEqual({
      'tabs.main/tab.option': {
        default: { color: '#666666' },
        selected: { fontWeight: '700' },
      },
    });
  });

  it('copies default styles into a destination state and overwrites existing destination styles', () => {
    const legacyConfig = {
      'button.primary': {
        color: '#000000',
      },
    };

    expect(ProjectService.copyStylesFromDefault(legacyConfig, 'button.primary', 'hover')).toEqual({
      'button.primary': {
        default: { color: '#000000' },
        hover: { color: '#000000' },
      },
    });

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
