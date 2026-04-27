
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Languages } from 'lucide-react';
import { StylePanel } from '../components/StylePanel';
import { TargetNavigator } from '../components/TargetNavigator';
import { AllowedStyleKey, CompatibilityReport, EditableStyleSet, ProjectFile, PreviewInfoResponse } from '../../domain/models';
import { useTranslation } from '../../infrastructure/i18n/I18nContext';
import { Language } from '../../domain/translations';
import { tryParseCanonicalKey } from '../../domain/targetKey';
import { RUNTIME_STYLE_STATES, RuntimeStyleState } from '../../domain/styleStateHelpers';

interface Props {
  project: ProjectFile;
  preview: PreviewInfoResponse | null;
  isConnected: boolean;
  compatibilityReport: CompatibilityReport | null;
  selectedTarget: string | null;
  selectedStyleState: RuntimeStyleState;
  onStyleStateSelect: (state: RuntimeStyleState) => void;
  onTargetSelect: (target: string | null) => void;
  onTargetHover: (target: string | null) => void;
  onUpdateStyle: (target: string, state: RuntimeStyleState, styles: EditableStyleSet) => void;
  onRemoveStyle: (target: string, state: RuntimeStyleState, key: AllowedStyleKey) => void;
  onCopyStateFromDefault: (target: string, state: RuntimeStyleState) => void;
  getEditableStylesForState: (target: string, state: RuntimeStyleState) => EditableStyleSet;
  getDefinedStatesForTarget: (target: string) => RuntimeStyleState[];
  computedStylesByTarget: Record<string, EditableStyleSet>;
  onExport: () => void;
}

export function EditorPage({ 
  project, 
  preview, 
  isConnected,
  compatibilityReport,
  selectedTarget, 
  selectedStyleState,
  onStyleStateSelect,
  onTargetSelect, 
  onTargetHover,
  onUpdateStyle,
  onRemoveStyle,
  onCopyStateFromDefault,
  getEditableStylesForState,
  getDefinedStatesForTarget,
  computedStylesByTarget,
  onExport
}: Props) {
  const { t, language, setLanguage } = useTranslation();
  const targets = Array.from(new Set([
    ...Object.keys(project.config),
    ...(preview?.editable.targets || []),
  ])).filter((target) => Boolean(tryParseCanonicalKey(target)));
  const styledTargets = new Set(Object.keys(project.config).filter((target) => getDefinedStatesForTarget(target).length > 0));
  const statefulTargets = new Set(Object.keys(project.config).filter((target) => getDefinedStatesForTarget(target).some((state) => state !== 'default')));
  const missingTargets = compatibilityReport?.missingTargetsInPreview || [];
  const newTargets = compatibilityReport?.newTargetsInPreview || [];
  const hasTargetDiagnostics = missingTargets.length > 0 || newTargets.length > 0;
  const projectSiteKey = project.project.siteKey || project.sourcePreview?.site?.siteKey || 'n/a';
  const previewSiteKey = preview?.site.siteKey || 'n/a';
  const connectionLabel = !isConnected
    ? t('editor.offline')
    : compatibilityReport?.severity === 'error'
      ? t('editor.connectionMismatch')
      : t('editor.previewConnected');
  const connectionTone = !isConnected
    ? 'text-rose-600'
    : compatibilityReport?.severity === 'error'
      ? 'text-amber-700'
      : 'text-emerald-600';
  const connectionDot = !isConnected
    ? 'bg-rose-500'
    : compatibilityReport?.severity === 'error'
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const compatibilityTone = compatibilityReport?.severity === 'error'
    ? 'bg-rose-50 border-rose-200 text-rose-800'
    : compatibilityReport?.severity === 'warning'
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800';

  const compatibilityTitle = compatibilityReport?.severity === 'error'
    ? t('editor.compatibilityError')
    : compatibilityReport?.severity === 'warning'
      ? t('editor.compatibilityWarning')
      : t('editor.compatibilityOk');
  const selectedTargetParts = selectedTarget ? tryParseCanonicalKey(selectedTarget) : null;
  const definedStates = selectedTarget ? getDefinedStatesForTarget(selectedTarget) : [];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-base">
      {/* Header Compact - 48px */}
      <header className="h-[56px] bg-white border-b border-border px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white rotate-45 scale-75"></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-text-main">LiveStyle Editor</span>
            <span className="text-[11px] text-text-muted font-mono opacity-50 uppercase tracking-widest leading-none">
              {project.project.siteKey || 'v1.1.0'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 border-r border-border mr-2">
            <Languages size={14} className="text-text-muted" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border-none focus:outline-none font-semibold text-text-main text-[11px] uppercase tracking-wider"
            >
              <option value="ca">CAT</option>
              <option value="es">ESP</option>
              <option value="en">ENG</option>
            </select>
          </div>
          
          <button 
            onClick={onExport}
            className="px-3 py-1.5 border border-border rounded bg-white text-[13px] font-medium hover:bg-slate-50 transition-colors"
          >
            {t('editor.exportJson')}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Compact - 260px */}
        <aside className="w-[260px] bg-white border-r border-border flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-border">
            <div className="text-[12px] font-bold text-text-muted uppercase tracking-widest mb-3">{t('editor.activeProject')}</div>
            <div className="bg-slate-50 border border-border rounded-md p-3">
              <div className="font-bold text-sm truncate">{project.project.name}</div>
              <div className="text-[12px] text-text-muted truncate mt-1">{project.project.baseUrl}</div>
              <div className={`flex items-center gap-1.5 mt-2 text-[12px] font-bold ${connectionTone}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${connectionDot}`} />
                {connectionLabel}
              </div>
              <div className="mt-3 space-y-1 text-[12px] text-text-muted font-mono">
                <div><span className="font-semibold not-italic">{t('editor.projectSiteKey')}:</span> {projectSiteKey}</div>
                <div><span className="font-semibold not-italic">{t('editor.previewSiteKey')}:</span> {previewSiteKey}</div>
                <div><span className="font-semibold not-italic">{t('editor.currentSiteKey')}:</span> {preview?.site.siteKey || projectSiteKey}</div>
              </div>
            </div>
          </div>

          <TargetNavigator
            targets={targets}
            selectedTarget={selectedTarget}
            styledTargets={styledTargets}
            statefulTargets={statefulTargets}
            onHover={onTargetHover}
            onSelect={(target) => onTargetSelect(target)}
            emptyMessage={t('editor.noEditableTargetsDetected')}
            title={t('editor.editableTargets')}
          />
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-[#fafafa] overflow-hidden">
          <div className="border-b border-border px-6 bg-white shrink-0">
            <div className="py-3 border-b-2 border-accent text-accent font-semibold text-[13px] inline-flex">
              {t('editor.visualEditor')}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {compatibilityReport && (
                <div className={`${compatibilityTone} border px-4 py-3 rounded-lg flex items-start gap-3`}>
                  <AlertCircle size={18} />
                  <div className="space-y-2">
                  <div className="text-sm font-semibold">{compatibilityTitle}</div>
                  {compatibilityReport.messages.length > 0 ? (
                      <div className="space-y-1">
                        {compatibilityReport.messages.map((message) => (
                          <div key={message} className="text-sm">{message}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm">{t('editor.compatibilityOk')}</div>
                    )}
                    {!hasTargetDiagnostics && compatibilityReport.severity !== 'error' ? (
                      <div className="text-[12px] uppercase tracking-widest font-bold opacity-70">
                        {t('editor.noTargetIssues')}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {selectedTarget ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <StylePanel 
                     target={selectedTarget}
                     styles={getEditableStylesForState(selectedTarget, selectedStyleState)}
                     configValue={project.config[selectedTarget]}
                     selectedStyleState={selectedStyleState}
                     availableStates={definedStates}
                     computedStyles={computedStylesByTarget[selectedTarget]}
                     onStyleStateSelect={onStyleStateSelect}
                     onCopyStateFromDefault={() => onCopyStateFromDefault(selectedTarget, selectedStyleState)}
                     onChange={(styles) => onUpdateStyle(selectedTarget, selectedStyleState, styles)}
                     onRemove={(key) => onRemoveStyle(selectedTarget, selectedStyleState, key)}
                    />
                </motion.div>
              ) : (
                <div className="text-center py-20 bg-white border border-dashed border-border rounded-xl">
                  <div className="text-text-muted mb-2 font-semibold font-sans">{t('editor.selectTargetPrompt')}</div>
                   <div className="text-[12px] text-text-muted opacity-60 uppercase tracking-widest italic font-mono">{t('editor.waitingInput')}</div>
                 </div>
               )}

              {preview && compatibilityReport && hasTargetDiagnostics && (
                <div className="bg-white border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
                    <CheckCircle2 size={16} className="text-accent" />
                    {t('editor.targetDiagnostics')}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {missingTargets.length > 0 && (
                      <div>
                        <div className="text-[12px] font-bold uppercase tracking-widest text-text-muted mb-2">
                          {t('editor.missingTargets')} ({missingTargets.length})
                        </div>
                        <div className="space-y-1">
                          {missingTargets.map((target) => (
                            <div key={target} className="text-sm font-mono text-rose-600 break-all">{target}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {newTargets.length > 0 && (
                      <div>
                        <div className="text-[12px] font-bold uppercase tracking-widest text-text-muted mb-2">
                          {t('editor.newTargets')} ({newTargets.length})
                        </div>
                        <div className="space-y-1">
                          {newTargets.map((target) => (
                            <div key={target} className="text-sm font-mono text-emerald-700 break-all">{target}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Status */}
          <footer className="h-8 bg-white border-top border-border px-3 flex items-center justify-between shrink-0 text-[12px] text-text-muted font-mono">
            <div>{t('editor.session')}: {project.project.projectId.slice(0, 8)} | {t('editor.protocol')}: 1.0.0</div>
            <div>
              {t('editor.target')}: {selectedTargetParts ? `${selectedTargetParts.scope} / ${selectedTargetParts.target}` : t('editor.noTargetSelectedShort')}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
