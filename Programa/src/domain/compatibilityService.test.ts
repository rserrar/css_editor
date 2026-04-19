import { describe, expect, it } from 'vitest';
import { CompatibilityService } from './compatibilityService';
import { PreviewInfoResponse, ProjectFile } from './models';

type ProjectOverrides = {
  project?: Partial<ProjectFile['project']>;
  sourcePreview?: ProjectFile['sourcePreview'];
  config?: ProjectFile['config'];
};

type PreviewOverrides = Partial<Omit<PreviewInfoResponse, 'page' | 'site' | 'editable'>> & {
  page?: Partial<PreviewInfoResponse['page']>;
  site?: Partial<PreviewInfoResponse['site']>;
  editable?: Partial<PreviewInfoResponse['editable']>;
};

function createProject(overrides: ProjectOverrides = {}): ProjectFile {
  return {
    schemaVersion: 2,
    project: {
      projectId: 'project-1',
      name: 'Demo Project',
      baseUrl: 'https://example.com/site',
      siteKey: 'example-site',
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      ...(overrides.project || {}),
    },
    sourcePreview: overrides.sourcePreview,
    config: overrides.config ?? {
      'hero.title': { color: '#111111' },
      'hero.button': { fontSize: '18px' },
    },
  };
}

function createPreview(overrides: PreviewOverrides = {}): PreviewInfoResponse {
  const { page, site, editable, ...rest } = overrides;

  return {
    type: 'preview:info:response',
    sessionId: 'session-1',
    source: 'preview',
    timestamp: Date.now(),
    protocolVersion: 1,
    moduleVersion: '1.0.0',
    page: {
      url: 'https://example.com/site/page',
      origin: 'https://example.com',
      title: 'Demo Page',
      ...(page || {}),
    } as PreviewInfoResponse['page'],
    site: {
      siteKey: 'example-site',
      siteName: 'Example',
      environment: 'test',
      ...(site || {}),
    } as PreviewInfoResponse['site'],
    editable: {
      targets: ['hero.title', 'hero.button'],
      count: 2,
      ...(editable || {}),
    } as PreviewInfoResponse['editable'],
    ...rest,
  };
}

describe('CompatibilityService.buildReport', () => {
  it('returns ok when protocol, siteKey and targets are aligned', () => {
    const report = CompatibilityService.buildReport(createProject(), createPreview());

    expect(report.protocolCompatible).toBe(true);
    expect(report.siteCompatible).toBe(true);
    expect(report.urlCompatible).toBeNull();
    expect(report.missingTargetsInPreview).toEqual([]);
    expect(report.newTargetsInPreview).toEqual([]);
    expect(report.severity).toBe('ok');
    expect(report.messages).toEqual([]);
  });

  it('returns error when protocolVersion is incompatible', () => {
    const project = createProject({
      sourcePreview: {
        protocolVersion: 2,
        page: { url: 'https://example.com/site/page', origin: 'https://example.com' },
        capturedAt: '2026-04-18T11:00:00.000Z',
      },
    });

    const report = CompatibilityService.buildReport(project, createPreview());

    expect(report.protocolCompatible).toBe(false);
    expect(report.severity).toBe('error');
    expect(report.messages.some((message) => message.includes('protocol 1') && message.includes('2'))).toBe(true);
  });

  it('returns error when siteKey is incompatible', () => {
    const report = CompatibilityService.buildReport(
      createProject(),
      createPreview({ site: { siteKey: 'other-site', siteName: 'Other' } }),
    );

    expect(report.siteCompatible).toBe(false);
    expect(report.severity).toBe('error');
    expect(report.messages.some((message) => message.includes('siteKey'))).toBe(true);
  });

  it('uses robust URL fallback when siteKey is missing and detects compatible URLs', () => {
    const project = createProject({ project: { siteKey: '', baseUrl: 'https://example.com/site' } });
    const preview = createPreview({
      site: { siteKey: '', siteName: 'No Site Key' },
      page: { url: 'https://example.com/site/landing', origin: 'https://example.com', title: 'Landing' },
    });

    const report = CompatibilityService.buildReport(project, preview);

    expect(report.siteCompatible).toBe(true);
    expect(report.urlCompatible).toBe(true);
    expect(report.severity).toBe('ok');
  });

  it('uses robust URL fallback when siteKey is missing and detects incompatible URLs', () => {
    const project = createProject({ project: { siteKey: '', baseUrl: 'https://example.com/site' } });
    const preview = createPreview({
      site: { siteKey: '', siteName: 'No Site Key' },
      page: { url: 'https://example.com/site-admin', origin: 'https://example.com', title: 'Admin' },
    });

    const report = CompatibilityService.buildReport(project, preview);

    expect(report.urlCompatible).toBe(false);
    expect(report.severity).toBe('error');
    expect(report.messages.some((message) => message.includes('URL de la preview'))).toBe(true);
  });

  it('returns warning when project targets are missing in preview', () => {
    const report = CompatibilityService.buildReport(
      createProject({ config: { 'hero.title': { color: '#111111' }, 'hero.button': { fontSize: '18px' }, 'hero.caption': { color: '#333333' } } }),
      createPreview(),
    );

    expect(report.severity).toBe('warning');
    expect(report.missingTargetsInPreview).toEqual(['hero.caption']);
    expect(report.messages.some((message) => message.includes('no existeixen a la preview'))).toBe(true);
  });

  it('returns warning when preview exposes new targets', () => {
    const report = CompatibilityService.buildReport(
      createProject(),
      createPreview({ editable: { targets: ['hero.title', 'hero.button', 'hero.badge'], count: 3 } }),
    );

    expect(report.severity).toBe('warning');
    expect(report.newTargetsInPreview).toEqual(['hero.badge']);
    expect(report.messages.some((message) => message.includes('targets nous'))).toBe(true);
  });

  it('treats scoped and legacy targets as different keys without equivalence magic', () => {
    const report = CompatibilityService.buildReport(
      createProject({ config: { 'menu.option': { color: '#111111' } } }),
      createPreview({ editable: { targets: ['layout.mainMenu/menu.option'], count: 1 } }),
    );

    expect(report.severity).toBe('warning');
    expect(report.missingTargetsInPreview).toEqual(['menu.option']);
    expect(report.newTargetsInPreview).toEqual(['layout.mainMenu/menu.option']);
    expect(report.messages.some((message) => message.includes('legacy vs scoped'))).toBe(true);
  });

  it('accepts matching scoped targets as compatible', () => {
    const report = CompatibilityService.buildReport(
      createProject({ config: { 'layout.mainMenu/menu.option': { color: '#111111' } } }),
      createPreview({ editable: { targets: ['layout.mainMenu/menu.option'], count: 1 } }),
    );

    expect(report.severity).toBe('ok');
    expect(report.missingTargetsInPreview).toEqual([]);
    expect(report.newTargetsInPreview).toEqual([]);
  });

  it('treats scoped project keys against legacy preview keys as warnings', () => {
    const report = CompatibilityService.buildReport(
      createProject({ config: { 'layout.mainMenu/menu.option': { color: '#111111' } } }),
      createPreview({ editable: { targets: ['menu.option'], count: 1 } }),
    );

    expect(report.severity).toBe('warning');
    expect(report.missingTargetsInPreview).toEqual(['layout.mainMenu/menu.option']);
    expect(report.newTargetsInPreview).toEqual(['menu.option']);
  });

  it('does not warn about new preview targets when the project is still empty', () => {
    const report = CompatibilityService.buildReport(
      createProject({ config: {} }),
      createPreview({ editable: { targets: ['hero.title', 'hero.button', 'hero.badge'], count: 3 } }),
    );

    expect(report.newTargetsInPreview).toEqual([]);
    expect(report.severity).toBe('ok');
  });

  it('keeps severity as error when warnings and errors coexist', () => {
    const project = createProject({
      sourcePreview: {
        protocolVersion: 2,
        page: { url: 'https://example.com/site/page', origin: 'https://example.com' },
        capturedAt: '2026-04-18T11:00:00.000Z',
      },
      config: {
        'hero.title': { color: '#111111' },
        'hero.button': { fontSize: '18px' },
        'hero.caption': { color: '#333333' },
      },
    });
    const preview = createPreview({
      site: { siteKey: 'other-site', siteName: 'Other' },
      editable: { targets: ['hero.title', 'hero.badge'], count: 2 },
    });

    const report = CompatibilityService.buildReport(project, preview);

    expect(report.severity).toBe('error');
    expect(report.protocolCompatible).toBe(false);
    expect(report.siteCompatible).toBe(false);
    expect(report.missingTargetsInPreview).toEqual(['hero.button', 'hero.caption']);
    expect(report.newTargetsInPreview).toEqual(['hero.badge']);
  });

  it('handles incomplete optional data without throwing', () => {
    const project = createProject({
      project: { baseUrl: undefined, siteKey: undefined },
      sourcePreview: {
        protocolVersion: 1,
        page: { url: '', origin: '' },
        capturedAt: '2026-04-18T11:00:00.000Z',
      },
    });
    const preview = createPreview({
      site: { siteKey: '', siteName: '' },
      editable: { targets: ['hero.title'], count: 1 },
      page: { url: '', origin: '', title: '' },
    });

    expect(() => CompatibilityService.buildReport(project, preview)).not.toThrow();

    const report = CompatibilityService.buildReport(project, preview);
    expect(report.urlCompatible).toBeNull();
    expect(report.severity).toBe('warning');
    expect(report.missingTargetsInPreview).toEqual(['hero.button']);
  });
});
