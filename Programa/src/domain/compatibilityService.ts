import { CompatibilityReport, PreviewInfoResponse, ProjectFile, SourcePreview } from './models';
import { parseCanonicalKey, tryParseCanonicalKey } from './targetKey';

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

function splitValidAndMalformedTargets(targets: string[]) {
  const validTargets: string[] = [];
  const malformedTargets: string[] = [];

  targets.forEach((target) => {
    try {
      validTargets.push(parseCanonicalKey(target).canonicalKey);
    } catch {
      malformedTargets.push(target);
    }
  });

  return { validTargets, malformedTargets };
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
        knownTargets: preview.editable.targets
          .map((target) => tryParseCanonicalKey(target)?.canonicalKey)
          .filter((target): target is string => Boolean(target)),
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
    const projectTargetValidation = splitValidAndMalformedTargets(projectTargets);
    const previewTargetValidation = splitValidAndMalformedTargets(previewTargets);
    const validProjectTargets = projectTargetValidation.validTargets;
    const validPreviewTargets = previewTargetValidation.validTargets;
    const previewTargetSet = new Set(previewTargets);
    const projectTargetSet = new Set(validProjectTargets);
    const isEmptyProject = validProjectTargets.length === 0;

    const missingTargetsInPreview = validProjectTargets.filter((target) => !new Set(validPreviewTargets).has(target));
    const newTargetsInPreview = isEmptyProject ? [] : validPreviewTargets.filter((target) => !projectTargetSet.has(target));

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
    if (projectTargetValidation.malformedTargets.length > 0) {
      messages.push(`${projectTargetValidation.malformedTargets.length} targets del projecte tenen una key malformada.`);
    }
    if (previewTargetValidation.malformedTargets.length > 0) {
      messages.push(`${previewTargetValidation.malformedTargets.length} targets de la preview tenen una key malformada.`);
    }

    const severity = !protocolCompatible || !siteCompatible || urlCompatible === false || projectTargetValidation.malformedTargets.length > 0 || previewTargetValidation.malformedTargets.length > 0
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
