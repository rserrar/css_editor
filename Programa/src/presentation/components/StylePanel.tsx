
import { useMemo, useState } from 'react';
import { AllowedStyleKey, ALLOWED_CSS_PROPERTIES, EditableStyleSet, StatefulStyleSet } from '../../domain/models';
import { useTranslation } from '../../infrastructure/i18n/I18nContext';
import { ChevronDown, X } from 'lucide-react';
import { StyleValueField } from './StyleValueField';
import { getDefinedStates, RUNTIME_STYLE_STATES, RuntimeStyleState } from '../../domain/styleStateHelpers';
import { tryParseCanonicalKey } from '../../domain/targetKey';

interface Props {
  target: string;
  styles: EditableStyleSet;
  configValue?: StatefulStyleSet;
  selectedStyleState: RuntimeStyleState;
  availableStates: RuntimeStyleState[];
  onStyleStateSelect: (state: RuntimeStyleState) => void;
  onCopyStateFromDefault: () => void;
  onChange: (styles: EditableStyleSet) => void;
  onRemove: (key: AllowedStyleKey) => void;
}

const PROPERTY_GROUPS: Array<{ titleKey: 'textGroup' | 'spacingGroup' | 'surfaceGroup' | 'imageGroup'; properties: AllowedStyleKey[] }> = [
  {
    titleKey: 'textGroup',
    properties: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textAlign', 'textTransform', 'textDecoration', 'lineHeight', 'letterSpacing', 'color'],
  },
  {
    titleKey: 'spacingGroup',
    properties: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
  },
  {
    titleKey: 'surfaceGroup',
    properties: ['backgroundColor', 'borderColor', 'borderWidth', 'borderRadius'],
  },
  {
    titleKey: 'imageGroup',
    properties: ['backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'objectFit', 'objectPosition'],
  },
];

const ESSENTIAL_PROPERTIES: AllowedStyleKey[] = ['color', 'fontSize', 'fontWeight', 'lineHeight', 'backgroundColor', 'borderRadius'];

export function StylePanel({ target, styles, configValue, selectedStyleState, availableStates, onStyleStateSelect, onCopyStateFromDefault, onChange, onRemove }: Props) {
  const { t } = useTranslation();
  const detectedStates = getDefinedStates(configValue);
  const extraStates = detectedStates.filter((state) => state !== 'default');
  const targetParts = tryParseCanonicalKey(target);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    spacingGroup: false,
    surfaceGroup: false,
    imageGroup: false,
    textGroup: true,
  });

  const visibleGroups = useMemo(() => PROPERTY_GROUPS.map((group) => ({
    ...group,
    properties: group.properties.filter((property) => ALLOWED_CSS_PROPERTIES.includes(property) && !ESSENTIAL_PROPERTIES.includes(property)),
  })).filter((group) => group.properties.length > 0), []);
  const essentialProperties = useMemo(
    () => ESSENTIAL_PROPERTIES.filter((property) => ALLOWED_CSS_PROPERTIES.includes(property)),
    [],
  );
  const definedCurrentProperties = useMemo(
    () => Object.entries(styles).filter(([, value]) => Boolean(value)) as Array<[AllowedStyleKey, string]>,
    [styles],
  );

  const getSemanticStateHelp = (state: RuntimeStyleState): string | null => {
    if (state === 'selected') return t('editor.stateSelectedHelp');
    if (state === 'open') return t('editor.stateOpenHelp');
    return null;
  };

  const currentStateHelp = getSemanticStateHelp(selectedStyleState);
  const currentStateStatus = availableStates.includes(selectedStyleState) ? t('editor.stateDefined') : t('editor.stateEmpty');
  const toggleSection = (sectionKey: string) => {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-slate-50/50 rounded-t-lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{t('editor.typographyVisuals')}</div>
            <div className="mt-1 text-base font-bold text-text-main break-all">{targetParts?.target || target}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted font-mono">
              {targetParts?.scope ? <span>{t('editor.scope')}: {targetParts.scope}</span> : null}
              <span>{t('editor.state')}: {selectedStyleState}</span>
              <span className="inline-flex items-center rounded-full border border-border bg-white px-2 py-0.5 font-semibold text-text-main">
                {currentStateStatus}
              </span>
            </div>
            {currentStateHelp ? (
              <div className="mt-2 max-w-2xl text-[11px] text-text-muted leading-relaxed">{currentStateHelp}</div>
            ) : null}
          </div>

          <div className="lg:max-w-[340px]">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{t('editor.state')}</div>
            <div className="flex flex-wrap gap-2">
          {RUNTIME_STYLE_STATES.map((state) => {
            const isActive = selectedStyleState === state;
            const isDefined = availableStates.includes(state);
            const stateIndicatorLabel = isDefined ? t('editor.stateDefined') : t('editor.stateEmpty');
            const semanticHelp = getSemanticStateHelp(state);
            const title = semanticHelp ? `${stateIndicatorLabel} - ${semanticHelp}` : stateIndicatorLabel;

            return (
              <button
                key={state}
                type="button"
                title={title}
                data-state-defined={isDefined ? 'true' : 'false'}
                onClick={() => onStyleStateSelect(state)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-accent text-white border-accent'
                    : isDefined
                      ? 'bg-white text-text-main border-border'
                      : 'bg-slate-100 text-text-muted border-transparent'
                }`}
                >
                <span
                  aria-hidden="true"
                  className={`border ${semanticHelp ? 'w-2 h-2 rotate-45 rounded-[2px]' : 'w-2 h-2 rounded-full'} ${
                    isDefined
                      ? isActive
                        ? 'bg-white border-white/80'
                        : semanticHelp
                          ? 'bg-violet-500 border-violet-500'
                          : 'bg-emerald-500 border-emerald-500'
                      : isActive
                        ? 'bg-transparent border-white/80'
                        : 'bg-transparent border-current/40'
                  }`}
                />
                {state}
              </button>
            );
          })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <section className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-border text-[11px] font-bold uppercase tracking-widest text-text-muted">
            {t('editor.quickStyles')}
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-4">
              {essentialProperties.map((prop) => (
                <div key={`${target}:${selectedStyleState}:essential:${prop}`} className="flex flex-col gap-1.5 group relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] font-semibold text-text-muted">
                      {prop.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {styles[prop] && (
                      <button
                        onClick={() => onRemove(prop)}
                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 p-1 rounded-full transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <StyleValueField
                    property={prop}
                    value={styles[prop] || ''}
                    onChange={(value) => onChange({ [prop]: value })}
                    onRemove={() => onRemove(prop)}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-md border border-dashed border-border bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
                {t('editor.definedStylesSummary')}
              </div>
              {definedCurrentProperties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {definedCurrentProperties.map(([property, value]) => (
                    <span key={`${property}:${value}`} className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-white px-2 py-1 text-[11px] text-text-main">
                      <span className="font-semibold">{property}</span>
                      <span className="truncate font-mono text-text-muted">{value}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-text-muted">{t('editor.noDefinedStylesInState')}</div>
              )}
              <div className="mt-2 text-[11px] text-text-muted">{t('editor.definedStylesHint')}</div>
            </div>
          </div>
        </section>

        {visibleGroups.map((group) => (
          <section key={group.titleKey} className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(group.titleKey)}
              className="w-full px-4 py-2.5 bg-slate-50 border-b border-border text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center justify-between text-left"
            >
              <span>{t(`editor.${group.titleKey}` as any)}</span>
              <ChevronDown size={14} className={`transition-transform ${openSections[group.titleKey] ? 'rotate-180' : ''}`} />
            </button>
            {openSections[group.titleKey] && (
            <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
              {group.properties.map((prop) => (
                <div key={`${target}:${selectedStyleState}:${prop}`} className="flex flex-col gap-1.5 group relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] font-semibold text-text-muted">
                      {prop.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {styles[prop] && (
                      <button
                        onClick={() => onRemove(prop)}
                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 p-1 rounded-full transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <StyleValueField
                    property={prop}
                    value={styles[prop] || ''}
                    onChange={(value) => onChange({ [prop]: value })}
                    onRemove={() => onRemove(prop)}
                  />
                </div>
              ))}
            </div>
            )}
          </section>
        ))}

        {(extraStates.length > 0 || selectedStyleState !== 'default') && (
          <section className="border border-border rounded-lg bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                {extraStates.length > 0 ? (
                  <div className="text-[11px] text-amber-700 font-medium">
                    {t('editor.detectedStateVariants')}: {extraStates.join(', ')}
                  </div>
                ) : null}
                {selectedStyleState !== 'default' ? (
                  <div className="text-[11px] text-text-muted">{t('editor.copyStateHint')}</div>
                ) : null}
              </div>

              {selectedStyleState !== 'default' && (
                <button
                  type="button"
                  onClick={onCopyStateFromDefault}
                  className="inline-flex items-center justify-center rounded-md border border-accent/20 bg-white px-3 py-2 text-[12px] font-semibold text-accent hover:bg-accent/5 transition-colors"
                >
                  {t('editor.copyFromDefault')}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
