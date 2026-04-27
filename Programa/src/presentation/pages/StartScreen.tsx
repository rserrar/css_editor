
import { motion } from 'motion/react';
import { Upload, Plus, Globe, Languages } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../infrastructure/i18n/I18nContext';
import { Language } from '../../domain/translations';
import { DraftSummary } from '../../infrastructure/storage/draftStorage';

interface Props {
  onNew: (url: string) => void;
  onLoad: (file: File, previewWindow: Window | null) => void;
  draftSummary: DraftSummary | null;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;
  startError: string | null;
}

export function StartScreen({ onNew, onLoad, draftSummary, onRestoreDraft, onDiscardDraft, startError }: Props) {
  const { t, language, setLanguage } = useTranslation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      const previewWindow = window.open('', 'live-style-preview');
      onLoad(file, previewWindow);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-[14px]">
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-border shadow-sm">
        <Languages size={14} className="text-text-muted" />
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-transparent border-none focus:outline-none font-semibold text-text-main text-[12px] uppercase tracking-wider"
        >
          <option value="ca">Català</option>
          <option value="es">Castellano</option>
          <option value="en">English</option>
        </select>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full space-y-6"
      >
        {startError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 shadow-sm">
            {startError}
          </div>
        )}

        {draftSummary && (
          <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-widest text-amber-700 mb-2">{t('start.draftAvailable')}</div>
                <h2 className="text-lg font-bold text-text-main">{draftSummary.projectName}</h2>
                <p className="text-text-muted mt-1">{draftSummary.baseUrl}</p>
                <p className="text-[13px] text-text-muted mt-3">{t('start.draftDescription')}</p>
                <p className="text-[12px] text-text-muted mt-2 font-mono uppercase tracking-wider">
                  {t('start.draftTimestamp')}: {new Date(draftSummary.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onRestoreDraft}
                  className="px-4 py-2.5 rounded-md bg-accent text-white font-semibold shadow-sm"
                >
                  {t('start.restoreDraft')}
                </button>
                <button
                  type="button"
                  onClick={onDiscardDraft}
                  className="px-4 py-2.5 rounded-md border border-border bg-white font-semibold text-text-main"
                >
                  {t('start.discardDraft')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Nou Projecte */}
        <div className="bg-surface p-8 rounded-xl shadow-sm border border-border">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
            <Plus className="text-accent" size={20} />
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2 tracking-tight">{t('start.newProject')}</h2>
          <p className="text-text-muted mb-8 leading-relaxed">{t('start.urlDescription')}</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const url = new FormData(e.currentTarget).get('url') as string;
            onNew(url);
          }}>
            <div className="relative mb-4">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                name="url" 
                type="url" 
                required 
                placeholder={t('start.urlPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-md focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-medium text-[14px]"
              />
            </div>
            <button className="w-full bg-accent text-white py-2.5 rounded-md font-semibold hover:bg-opacity-90 transition-all shadow-md shadow-accent/10">
              {t('start.startEditing')}
            </button>
          </form>
          <p className="mt-3 text-[12px] text-text-muted">{t('start.previewOpensInNewWindow')}</p>
        </div>

        {/* Carregar Projecte */}
        <div className="bg-surface p-8 rounded-xl shadow-sm border border-border flex flex-col">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-6">
            <Upload className="text-emerald-600" size={20} />
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2 tracking-tight">{t('start.loadProject')}</h2>
          <p className="text-text-muted mb-8 leading-relaxed">{t('start.loadFileDescription')}</p>
          
          <div className="mt-auto">
            <input 
              type="file" 
              accept=".json" 
              id="file-upload" 
              className="hidden" 
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="file-upload"
              className="flex items-center justify-center w-full border border-dashed border-border p-6 rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group"
            >
              <div className="text-center">
                <p className="font-semibold text-text-main group-hover:text-accent">{t('start.uploadJson')}</p>
                <p className="text-[12px] text-text-muted mt-1 uppercase tracking-wider font-mono">{t('start.formatLabel')}</p>
                <p className="text-[12px] text-text-muted mt-3">{t('start.loadProjectHint')}</p>
              </div>
            </label>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-border rounded-xl shadow-sm p-6">
            <div className="text-[12px] font-bold uppercase tracking-widest text-text-muted mb-3">{t('start.howItWorks')}</div>
            <div className="space-y-3 text-[14px] text-text-main">
              <div><span className="font-semibold">1.</span> {t('start.howItWorksStep1')}</div>
              <div><span className="font-semibold">2.</span> {t('start.howItWorksStep2')}</div>
              <div><span className="font-semibold">3.</span> {t('start.howItWorksStep3')}</div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm p-6">
            <div className="text-[12px] font-bold uppercase tracking-widest text-text-muted mb-3">{t('start.contractTitle')}</div>
            <div className="space-y-2 text-[14px] text-text-main">
              <div className="rounded-lg bg-slate-50 border border-border px-3 py-2 font-mono text-[13px]">data-editable-scope</div>
              <div className="rounded-lg bg-slate-50 border border-border px-3 py-2 font-mono text-[13px]">data-editable</div>
              <div className="text-text-muted leading-relaxed">{t('start.contractHint')}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
