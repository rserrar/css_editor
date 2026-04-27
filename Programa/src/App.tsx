/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import { useEditor } from './app/useEditor';
import { StartScreen } from './presentation/pages/StartScreen';
import { EditorPage } from './presentation/pages/EditorPage';
import { I18nProvider, useTranslation } from './infrastructure/i18n/I18nContext';
import { CompatibilityService } from './domain/compatibilityService';
import { ProjectService } from './domain/projectService';

function AppContent() {
  const { t } = useTranslation();
  const [startError, setStartError] = useState<string | null>(null);
  const previewWindowRef = useRef<Window | null>(null);
  const previewOriginRef = useRef<string | null>(null);
  const sessionId = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('session') || crypto.randomUUID();
  })[0];

  const getPreviewWindow = useCallback(
    () => (previewWindowRef.current && !previewWindowRef.current.closed ? previewWindowRef.current : null),
    [],
  );
  const getPreviewOrigin = useCallback(() => previewOriginRef.current, []);

  const {
    project,
    previewInfo,
    selectedTarget,
    selectedStyleState,
    isConnected,
    compatibilityReport,
    availableDraft,
    updateStyle,
    removeStyle,
    copyStateFromDefault,
    setSelectedStyleState,
    selectTarget,
    hoverTarget,
    getEditableStylesForState,
    getDefinedStatesForTarget,
    createProject,
    loadProject,
    restoreDraft,
    discardDraft,
  } = useEditor(sessionId, getPreviewWindow, getPreviewOrigin);

  const handleExport = () => {
    if (!project) return;
    const exportableProject = ProjectService.prepareForPersistence(
      project,
      previewInfo ? CompatibilityService.buildSourcePreview(previewInfo) : project.sourcePreview,
    );
    const blob = new Blob([JSON.stringify(exportableProject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ProjectService.buildExportFilename(exportableProject);
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildPreviewUrl = (baseUrl: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set('session', sessionId);
    return url.toString();
  };

   const openPreview = (baseUrl: string, previewWindow?: Window | null) => {
     try {
       const previewUrl = buildPreviewUrl(baseUrl);
       const previewOrigin = new URL(previewUrl).origin;

      if (previewWindowRef.current && !previewWindowRef.current.closed && previewWindowRef.current !== previewWindow) {
        previewWindowRef.current.close();
      }

      previewOriginRef.current = null;

      if (previewWindow) {
        previewWindow.location.href = previewUrl;
        previewWindow.focus();
        previewWindowRef.current = previewWindow;
      } else {
        const openedWindow = window.open(previewUrl, `live-style-preview-${sessionId}`);
        if (!openedWindow) {
          setStartError(t('start.popupBlocked'));
          return false;
        }
        openedWindow.focus();
        previewWindowRef.current = openedWindow;
      }

      previewOriginRef.current = previewOrigin;

      setStartError(null);
      return true;
    } catch {
      if (previewWindow) {
        previewWindow.close();
      }
      previewWindowRef.current = null;
      previewOriginRef.current = null;
      setStartError(t('start.invalidPreviewUrl'));
      return false;
    }
  };

  const handleCreateProject = (url: string) => {
    if (!openPreview(url)) return;
    createProject(url);
  };

  const handleLoadFile = (file: File, previewWindow: Window | null) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const validated = ProjectService.parseProjectFileJson(e.target?.result as string);
        if (validated.project.baseUrl && !openPreview(validated.project.baseUrl, previewWindow)) {
          return;
        }

        if (!validated.project.baseUrl && previewWindow) {
          previewWindow.close();
        }

        loadProject(validated);
        setStartError(null);
      } catch (err) {
        if (previewWindow) {
          previewWindow.close();
        }
        previewWindowRef.current = null;
        previewOriginRef.current = null;
        setStartError(err instanceof Error ? err.message : t('errors.invalidJson'));
      }
    };
    reader.readAsText(file);
  };

  if (!project) {
    return (
        <StartScreen
          onNew={handleCreateProject}
          onLoad={handleLoadFile}
          draftSummary={availableDraft}
          onRestoreDraft={restoreDraft}
          onDiscardDraft={discardDraft}
          startError={startError}
        />
      );
  }

  return (
    <EditorPage 
      project={project}
      preview={previewInfo}
      isConnected={isConnected}
      compatibilityReport={compatibilityReport}
      selectedTarget={selectedTarget}
      selectedStyleState={selectedStyleState}
      onStyleStateSelect={setSelectedStyleState}
      onTargetSelect={selectTarget}
      onTargetHover={hoverTarget}
      onUpdateStyle={updateStyle}
      onRemoveStyle={removeStyle}
      onCopyStateFromDefault={copyStateFromDefault}
      getEditableStylesForState={getEditableStylesForState}
      getDefinedStatesForTarget={getDefinedStatesForTarget}
      onExport={handleExport}
    />
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
