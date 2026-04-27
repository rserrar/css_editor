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
      'home.hero/home.title': { default: { color: '#111111' } },
      'home.hero/home.button': { default: { fontSize: '18px' } },
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
      targets: ['home.hero/home.title', 'home.hero/home.button'],
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

  it('returns warning when project targets are missing in preview', () => {
    const report = CompatibilityService.buildReport(
      createProject({
        config: {
          'home.hero/home.title': { default: { color: '#111111' } },
          'home.hero/home.button': { default: { fontSize: '18px' } },
          'home.hero/home.caption': { default: { color: '#333333' } },
        },
      }),
      createPreview(),
    );

    expect(report.severity).toBe('warning');
    expect(report.missingTargetsInPreview).toEqual(['home.hero/home.caption']);
  });

  it('returns warning when preview exposes new targets', () => {
    const report = CompatibilityService.buildReport(
      createProject(),
      createPreview({ editable: { targets: ['home.hero/home.title', 'home.hero/home.button', 'home.hero/home.badge'], count: 3 } }),
    );

    expect(report.severity).toBe('warning');
    expect(report.newTargetsInPreview).toEqual(['home.hero/home.badge']);
  });

  it('treats malformed preview target keys as an error', () => {
    const report = CompatibilityService.buildReport(
      createProject(),
      createPreview({ editable: { targets: ['home.hero/home.title', 'menu.option'], count: 2 } }),
    );

    expect(report.severity).toBe('error');
    expect(report.messages.some((message) => message.includes('key malformada'))).toBe(true);
  });

  it('does not warn about new preview targets when the project is still empty', () => {
    const report = CompatibilityService.buildReport(
      createProject({ config: {} }),
      createPreview({ editable: { targets: ['home.hero/home.title', 'home.hero/home.button', 'home.hero/home.badge'], count: 3 } }),
    );

    expect(report.newTargetsInPreview).toEqual([]);
    expect(report.severity).toBe('ok');
  });
});

describe('CompatibilityService.buildSourcePreview', () => {
  it('filters malformed preview targets instead of throwing', () => {
    const preview = createPreview({
      editable: {
        targets: ['home.hero/home.title', 'menu.option', 'layout.mainMenu/'],
        count: 3,
      },
    });

    expect(CompatibilityService.buildSourcePreview(preview).editable).toEqual({
      knownTargets: ['home.hero/home.title'],
      count: 3,
    });
  });
});
