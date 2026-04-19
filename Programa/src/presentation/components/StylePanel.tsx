
import { AllowedStyleKey, ALLOWED_CSS_PROPERTIES, EditableStyleSet, StyleConfigValue } from '../../domain/models';
import { useTranslation } from '../../infrastructure/i18n/I18nContext';
import { X } from 'lucide-react';
import { StyleValueField } from './StyleValueField';
import { getDefinedStates, RUNTIME_STYLE_STATES, RuntimeStyleState } from '../../domain/styleStateHelpers';

interface Props {
  target: string;
  styles: EditableStyleSet;
  configValue?: StyleConfigValue;
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

export function StylePanel({ target, styles, configValue, selectedStyleState, availableStates, onStyleStateSelect, onCopyStateFromDefault, onChange, onRemove }: Props) {
  const { t } = useTranslation();
  const detectedStates = getDefinedStates(configValue);
  const extraStates = detectedStates.filter((state) => state !== 'default');
  const visibleGroups = PROPERTY_GROUPS.map((group) => ({
    ...group,
    properties: group.properties.filter((property) => ALLOWED_CSS_PROPERTIES.includes(property)),
  })).filter((group) => group.properties.length > 0);

  const getSemanticStateHelp = (state: RuntimeStyleState): string | null => {
    if (state === 'selected') return t('editor.stateSelectedHelp');
    if (state === 'open') return t('editor.stateOpenHelp');
    return null;
  };

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-slate-50/50 rounded-t-lg">
        <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          {t('editor.typographyVisuals')}: {target}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
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
        {extraStates.length > 0 && (
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            {t('editor.detectedStateVariants')}: {extraStates.join(', ')}
          </div>
        )}
        {selectedStyleState !== 'default' && (
          <div className="mt-3">
            <button
              type="button"
              onClick={onCopyStateFromDefault}
              className="text-[11px] font-semibold text-accent hover:underline"
            >
              {t('editor.copyFromDefault')}
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-4">
        {visibleGroups.map((group) => (
          <section key={group.titleKey} className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-border text-[11px] font-bold uppercase tracking-widest text-text-muted">
              {t(`editor.${group.titleKey}` as any)}
            </div>
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
          </section>
        ))}
      </div>
    </div>
  );
}
