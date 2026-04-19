import { CompatibilityReport, PreviewInfoResponse, ProjectFile, SourcePreview } from './models';
import { hasScopedTargetKey } from './targetKey';

const CURRENT_PROTOCOL_VERSION = 1;

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function areUrlsCompatible(projectUrl: string, previewUrl: string): boolean | null {
  const projectParsed = parseUrl(projectUrl);
  const previewParsed = parseUrl(previewUrl);

  if (!projectParsed || !previewParsed) return null;
  if (projectParsed.origin !== previewParsed.origin) return false;

  const projectPath = normalizePathname(projectParsed.pathname);
  const previewPath = normalizePathname(previewParsed.pathname);

  if (projectPath === '/') return true;
  return previewPath === projectPath || previewPath.startsWith(`${projectPath}/`);
}

export const CompatibilityService = {
  currentProtocolVersion: CURRENT_PROTOCOL_VERSION,

  buildSourcePreview(preview: PreviewInfoResponse): SourcePreview {
    return {
      protocolVersion: preview.protocolVersion,
      moduleVersion: preview.moduleVersion,
      page: {
        url: preview.page.url,
        origin: preview.page.origin,
        title: preview.page.title,
      },
      site: {
        siteKey: preview.site.siteKey,
        siteName: preview.site.siteName,
        environment: preview.site.environment,
      },
      editable: {
        knownTargets: preview.editable.targets,
        count: preview.editable.count,
      },
      capturedAt: new Date().toISOString(),
    };
  },

  buildReport(project: ProjectFile, preview: PreviewInfoResponse): CompatibilityReport {
    const expectedProtocolVersion = project.sourcePreview?.protocolVersion ?? CURRENT_PROTOCOL_VERSION;
    const protocolCompatible = preview.protocolVersion === expectedProtocolVersion;

    const projectSiteKey = project.project.siteKey?.trim() || project.sourcePreview?.site?.siteKey?.trim();
    const previewSiteKey = preview.site.siteKey?.trim();
    const shouldCheckSite = Boolean(projectSiteKey && previewSiteKey);
    const siteCompatible = shouldCheckSite ? projectSiteKey === previewSiteKey : true;

    const shouldFallbackToUrl = !shouldCheckSite;
    const urlCompatible = shouldFallbackToUrl
      ? areUrlsCompatible(project.project.baseUrl, preview.page.url)
      : null;

    const projectTargets = Object.keys(project.config);
    const previewTargets = preview.editable.targets;
    const previewTargetSet = new Set(previewTargets);
    const projectTargetSet = new Set(projectTargets);
    const isEmptyProject = projectTargets.length === 0;
    const projectHasScopedTargets = projectTargets.some((target) => hasScopedTargetKey(target));
    const previewHasScopedTargets = previewTargets.some((target) => hasScopedTargetKey(target));

    const missingTargetsInPreview = projectTargets.filter((target) => !previewTargetSet.has(target));
    const newTargetsInPreview = isEmptyProject ? [] : previewTargets.filter((target) => !projectTargetSet.has(target));

    const messages: string[] = [];
    if (!protocolCompatible) {
      messages.push(`La preview usa protocol ${preview.protocolVersion} i el projecte espera ${expectedProtocolVersion}.`);
    }
    if (!siteCompatible) {
      messages.push(`El siteKey de la preview (${previewSiteKey}) no coincideix amb el del projecte (${projectSiteKey}).`);
    }
    if (urlCompatible === false) {
      messages.push(`La URL de la preview (${preview.page.url}) no coincideix amb la base del projecte (${project.project.baseUrl}).`);
    }
    if (missingTargetsInPreview.length > 0) {
      messages.push(`${missingTargetsInPreview.length} targets del projecte no existeixen a la preview actual.`);
    }
    if (newTargetsInPreview.length > 0) {
      messages.push(`${newTargetsInPreview.length} targets nous existeixen a la preview i encara no al projecte.`);
    }
    if (projectTargets.length > 0 && previewTargets.length > 0 && projectHasScopedTargets !== previewHasScopedTargets) {
      messages.push('El projecte i la preview fan servir formats de target diferents (legacy vs scoped). No es consideren equivalents automàticament.');
    }

    const severity = !protocolCompatible || !siteCompatible || urlCompatible === false
      ? 'error'
      : missingTargetsInPreview.length > 0 || newTargetsInPreview.length > 0
        ? 'warning'
        : 'ok';

    return {
      protocolCompatible,
      siteCompatible,
      urlCompatible,
      missingTargetsInPreview,
      newTargetsInPreview,
      severity,
      messages,
    };
  },
};
