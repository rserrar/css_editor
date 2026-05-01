import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AllowedStyleKey } from '../../domain/models';
import { getStyleSchema } from '../../domain/styleSchema';
import { buildStructuredStyleValue, isHexColor, normalizeColorValue, parseStructuredStyleValue, validateStyleValue } from '../../domain/styleValidators';
import { useTranslation } from '../../infrastructure/i18n/I18nContext';
import { Check, CircleDot, PencilLine, RotateCcw } from 'lucide-react';

interface Props {
  property: AllowedStyleKey;
  value: string;
  computedValue?: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

function formatLabel(property: string): string {
  return property.replace(/([A-Z])/g, ' $1').trim();
}

function normalizeComparableValue(property: AllowedStyleKey, rawValue: string): string {
  const normalized = rawValue.trim();
  if (!normalized) return '';

  const result = validateStyleValue(property, normalized);
  if (result.isValid) {
    return result.normalizedValue.trim().toLowerCase();
  }

  return normalized.toLowerCase();
}

function toHexByte(value: number): string {
  return value.toString(16).padStart(2, '0');
}

function rgbLikeToHex(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return null;

  const channels = match[1].split(',').map((part) => part.trim());
  if (channels.length < 3) return null;

  const r = Number(channels[0]);
  const g = Number(channels[1]);
  const b = Number(channels[2]);
  if (![r, g, b].every((channel) => Number.isFinite(channel) && channel >= 0 && channel <= 255)) {
    return null;
  }

  return `#${toHexByte(Math.round(r))}${toHexByte(Math.round(g))}${toHexByte(Math.round(b))}`;
}

function isLikelyComputedPx(value: string): boolean {
  return /^-?\d+(?:\.\d+)?px$/i.test(value.trim());
}

function inferOriginalUnitHint(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (!match) return null;

  const px = Number(match[1]);
  if (!Number.isFinite(px)) return null;

  const decimals = (match[1].split('.')[1] || '').length;
  const looksNormalized = decimals >= 2;
  if (!looksNormalized) return null;

  const candidateBases = [16, 15, 14, 18, 20];
  for (const base of candidateBases) {
    const em = px / base;
    const rounded1 = Math.round(em * 10) / 10;
    const rounded2 = Math.round(em * 100) / 100;
    const near1 = Math.abs(em - rounded1) <= 0.02;
    const near2 = Math.abs(em - rounded2) <= 0.006;
    if (near1 || near2) {
      return rounded1 % 1 === 0 ? `${rounded1.toFixed(0)}em` : `${rounded1.toFixed(1)}em`;
    }
  }

  return null;
}

export function StyleValueField({ property, value, computedValue, onChange, onRemove }: Props) {
  const { t } = useTranslation();
  const schema = getStyleSchema(property);
  const isActive = Boolean(value);
  const displayValue = value || (!isActive && computedValue ? computedValue : '');
  const validation = useMemo(() => validateStyleValue(property, value), [property, value]);
  const structuredValue = useMemo(() => parseStructuredStyleValue(property, displayValue), [property, displayValue]);
  const fallbackValue = schema.defaultValue || '';

  const [textDraft, setTextDraft] = useState(displayValue);
  const [numberDraft, setNumberDraft] = useState(structuredValue.number);
  const [unitDraft, setUnitDraft] = useState(structuredValue.unit || schema.units?.[0] || '');
  const [lastKnownValue, setLastKnownValue] = useState(value || fallbackValue);

  useEffect(() => {
    setTextDraft(displayValue);
    setLastKnownValue(value || fallbackValue);
  }, [displayValue, value, fallbackValue]);

  useEffect(() => {
    setNumberDraft(structuredValue.number);
    setUnitDraft(structuredValue.unit || schema.units?.[0] || '');
  }, [structuredValue.number, structuredValue.unit, schema.units]);

  const warningMessage = value && !validation.isValid ? t('editor.invalidPropertyValue') : null;
  const contextualPlaceholder = computedValue || schema.defaultValue || formatLabel(property);
  const comparisonState = useMemo(() => {
    if (!computedValue) {
      return null;
    }

    if (!isActive || !value) {
      return 'base';
    }

    const currentComparable = normalizeComparableValue(property, value);
    const baseComparable = normalizeComparableValue(property, computedValue);
    return currentComparable === baseComparable ? 'matches' : 'overrides';
  }, [computedValue, isActive, property, value]);
  const unitHint = useMemo(() => (computedValue ? inferOriginalUnitHint(computedValue) : null), [computedValue]);

  const handleReset = () => {
    const nextValue = lastKnownValue || fallbackValue;
    if (nextValue) {
      onChange(nextValue);
    }
  };

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      onRemove();
      return;
    }

    const computedCandidate = computedValue ? validateStyleValue(property, computedValue) : null;
    const nextValue = (computedCandidate && computedCandidate.isValid ? computedCandidate.normalizedValue : '') || lastKnownValue || fallbackValue;
    if (nextValue) {
      onChange(nextValue);
    }
  };

  const renderWarning = () => warningMessage ? <div className="text-[12px] text-amber-700">{warningMessage}</div> : null;

  const renderControls = (input: JSX.Element) => (
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
        <input
          type="checkbox"
          aria-label={`${property}-enabled`}
          checked={isActive}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-2 h-4 w-4 rounded border-border text-accent focus:ring-accent/20"
        />
        <div className="flex-1">{input}</div>
        <button
          type="button"
          aria-label={`${property}-reset`}
          onClick={handleReset}
          disabled={!lastKnownValue && !fallbackValue}
          className="mt-1 p-1.5 rounded border border-border bg-white text-text-muted hover:text-text-main hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={12} />
        </button>
      </div>
      {computedValue ? (
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <div className="text-text-muted font-mono">
            {t('editor.baseValue')}: {computedValue} <span className="uppercase tracking-wide">({t('editor.computedValueTag')})</span>
            {unitHint ? <span className="ml-2">{t('editor.probableOriginalUnit')}: {unitHint}</span> : null}
          </div>
          {comparisonState ? (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                comparisonState === 'matches'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : comparisonState === 'overrides'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              {comparisonState === 'matches' ? <Check size={10} className="mr-1" /> : null}
              {comparisonState === 'overrides' ? <PencilLine size={10} className="mr-1" /> : null}
              {comparisonState === 'base' ? <CircleDot size={10} className="mr-1" /> : null}
              {comparisonState === 'matches'
                ? t('editor.baseMatch')
                : comparisonState === 'overrides'
                  ? t('editor.baseOverride')
                  : t('editor.baseUsed')}
            </span>
          ) : null}
        </div>
      ) : null}
      {renderWarning()}
    </div>
  );

  if (schema.type === 'select') {
    const hasLegacyValue = Boolean(displayValue) && !schema.options?.includes(displayValue);

    return renderControls(
      <select
        aria-label={property}
        className="w-full px-2 py-1.5 text-[13px] border border-border rounded bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        value={displayValue || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t('editor.selectOption')}</option>
        {hasLegacyValue && <option value={displayValue}>{displayValue}</option>}
        {schema.options?.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (schema.type === 'color') {
    const normalizedHex = isHexColor(displayValue)
      ? normalizeColorValue(displayValue)
      : rgbLikeToHex(displayValue) || schema.defaultValue || '#000000';

    return renderControls(
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${property}-picker`}
          className="h-9 w-12 border border-border rounded bg-white p-1"
          value={normalizedHex}
          onChange={(e) => {
            const nextValue = normalizeColorValue(e.target.value);
            setTextDraft(nextValue);
            onChange(nextValue);
          }}
          disabled={!isActive}
        />
        <input
          type="text"
          aria-label={property}
          className="flex-1 px-2 py-1.5 text-[13px] border border-border rounded bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-mono"
          value={textDraft}
          onChange={(e) => {
            const nextValue = e.target.value;
            setTextDraft(nextValue);
            const result = validateStyleValue(property, nextValue);
            if (result.isValid) {
              onChange(result.normalizedValue);
            }
          }}
          placeholder={computedValue || schema.defaultValue || '#000000'}
          disabled={!isActive}
        />
      </div>
    );
  }

  if (schema.type === 'size' || schema.type === 'spacing') {
    if (displayValue && !structuredValue.isValid) {
      return renderControls(
        <input
          type="text"
          aria-label={property}
          className="w-full px-2 py-1.5 text-[13px] border border-amber-300 rounded bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all font-mono"
          value={textDraft}
          onChange={(e) => {
            const nextValue = e.target.value;
            setTextDraft(nextValue);
            const result = validateStyleValue(property, nextValue);
            if (result.isValid) {
              onChange(result.normalizedValue);
            }
          }}
          placeholder={computedValue || schema.defaultValue || '16px'}
          disabled={!isActive}
        />
      );
    }

    return renderControls(
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          aria-label={`${property}-number`}
          className="flex-1 px-2 py-1.5 text-[13px] border border-border rounded bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-mono"
          value={numberDraft}
          onChange={(e) => {
            const nextNumber = e.target.value;
            setNumberDraft(nextNumber);
            const result = buildStructuredStyleValue(property, nextNumber, unitDraft);
            if (result.isValid) {
              onChange(result.normalizedValue);
            }
          }}
          placeholder="0"
          disabled={!isActive}
        />
        <select
          aria-label={`${property}-unit`}
          className="w-24 px-2 py-1.5 text-[13px] border border-border rounded bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          value={unitDraft}
          onChange={(e) => {
            const nextUnit = e.target.value;
            setUnitDraft(nextUnit);
            const result = buildStructuredStyleValue(property, numberDraft, nextUnit);
            if (result.isValid) {
              onChange(result.normalizedValue);
            }
          }}
          disabled={!isActive}
        >
          {schema.allowUnitless && <option value="">{t('editor.noUnit')}</option>}
          {schema.units?.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>
    );
  }
  return renderControls(
    <input
      type="text"
      aria-label={property}
      className="w-full px-2 py-1.5 text-[13px] border border-border rounded bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-mono"
      value={textDraft}
      onChange={(e) => {
        const nextValue = e.target.value;
        setTextDraft(nextValue);
        const result = validateStyleValue(property, nextValue);
        if (result.isValid) {
          onChange(result.normalizedValue);
        }
      }}
      placeholder={contextualPlaceholder}
      disabled={!isActive}
    />
  );
}
