import { useMemo, useState } from 'react';
import { Layers3, Dot, Search, X } from 'lucide-react';
import { useTranslation } from '../../infrastructure/i18n/I18nContext';
import { tryParseCanonicalKey } from '../../domain/targetKey';

interface Props {
  targets: string[];
  selectedTarget: string | null;
  styledTargets: Set<string>;
  statefulTargets: Set<string>;
  onHover: (target: string | null) => void;
  onSelect: (target: string | null) => void;
  emptyMessage: string;
  title: string;
}

type TargetGroup = {
  key: string;
  label: string;
  items: Array<{ full: string; target: string; scope: string }>;
};

function buildGroups(targets: string[]): TargetGroup[] {
  const groups = new Map<string, TargetGroup>();

  [...targets].sort((a, b) => a.localeCompare(b)).forEach((target) => {
    const parsed = tryParseCanonicalKey(target);
    if (!parsed) return;
    const groupKey = parsed.scope;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        label: parsed.scope,
        items: [],
      });
    }

    groups.get(groupKey)?.items.push({
      full: parsed.canonicalKey,
      target: parsed.target,
      scope: parsed.scope,
    });
  });

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function TargetNavigator({ targets, selectedTarget, styledTargets, statefulTargets, onHover, onSelect, emptyMessage, title }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const selectedTargetParts = selectedTarget ? tryParseCanonicalKey(selectedTarget) : null;

  const filteredTargets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return targets;

    return targets.filter((target) => {
      const parsed = tryParseCanonicalKey(target);
      if (!parsed) return false;
      return [parsed.canonicalKey, parsed.scope, parsed.target].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [targets, query]);

  const groups = buildGroups(filteredTargets);
  const hasFilter = query.trim().length > 0;
  const emptyStateMessage = hasFilter ? t('editor.noFilteredTargets') : emptyMessage;
  const visibleCount = filteredTargets.length;

  return (
    <div className="p-4 flex-1 flex flex-col overflow-hidden">
      <div className="mb-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] font-bold text-text-muted uppercase tracking-widest">{title}</div>
            <div className="mt-1 text-[13px] text-text-muted">
              {targets.length} {t('editor.totalTargets')} - {visibleCount} {t('editor.visibleTargets')}
            </div>
          </div>

          {selectedTarget && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="shrink-0 rounded-md border border-border bg-white px-2 py-1 text-[12px] font-semibold text-text-muted hover:text-text-main hover:bg-slate-50"
            >
              {t('editor.clearSelection')}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className="rounded-full border border-border bg-slate-50 px-2 py-1 text-text-muted">
            {styledTargets.size} {t('editor.styledTargetsCount')}
          </span>
          <span className="rounded-full border border-border bg-slate-50 px-2 py-1 text-text-muted">
            {statefulTargets.size} {t('editor.statefulTargetsCount')}
          </span>
          {selectedTargetParts && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-accent font-medium truncate max-w-full">
              {selectedTargetParts.target}
            </span>
          )}
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('editor.filterTargets')}
          className="w-full pl-9 pr-8 py-2 text-[13px] border border-border rounded bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        />
        {hasFilter && (
          <button
            type="button"
            aria-label={t('editor.clearTargetFilter')}
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:bg-slate-100 hover:text-text-main"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {filteredTargets.length === 0 ? (
        <div className="flex-1 rounded-lg border border-dashed border-border bg-slate-50 px-4 py-6 text-center text-[13px] text-text-muted">
          {emptyStateMessage}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {groups.map((group) => (
            <div key={group.key} className="space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-text-muted">
                <Layers3 size={12} />
                <span>{group.label}</span>
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isSelected = selectedTarget === item.full;
                  const hasStyles = styledTargets.has(item.full);
                  const hasStateVariants = statefulTargets.has(item.full);

                  return (
                    <button
                      key={item.full}
                      type="button"
                      aria-pressed={isSelected}
                      onMouseEnter={() => onHover(item.full)}
                      onMouseLeave={() => onHover(null)}
                      onFocus={() => onHover(item.full)}
                      onBlur={() => onHover(null)}
                      onClick={() => onSelect(item.full)}
                      className={`w-full group text-left px-3 py-2 rounded transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-50 text-accent border border-blue-200'
                          : 'text-text-main hover:bg-slate-100 border border-transparent'
                      }`}
                      >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{item.target}</div>
                        <div className="text-[11px] opacity-70 truncate block">{item.scope}</div>
                        <code className="text-[11px] opacity-60 font-mono truncate block">{item.full}</code>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 justify-center min-w-[28px]">
                        {hasStateVariants && (
                          <span
                            aria-label={t('editor.stateVariantsTarget')}
                            title={t('editor.stateVariantsTarget')}
                            className={`w-2 h-2 rounded-full border ${isSelected ? 'bg-violet-500 border-violet-500' : 'bg-violet-100 border-violet-400'}`}
                          />
                        )}
                        {hasStyles && <Dot aria-label={t('editor.styledTarget')} size={18} className={isSelected ? 'text-accent' : 'text-emerald-600'} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
