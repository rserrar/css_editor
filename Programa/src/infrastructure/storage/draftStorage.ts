import { ProjectFile, SourcePreview } from '../../domain/models';
import { ProjectService } from '../../domain/projectService';

const STORAGE_KEY = 'live-style-editor:draft';
const MAX_DRAFT_AGE_MS = 1000 * 60 * 60 * 24;

export interface StoredDraft {
  sessionId: string;
  project: ProjectFile;
  sourcePreview?: SourcePreview;
  timestamp: string;
}

export interface DraftSummary {
  sessionId: string;
  projectName: string;
  baseUrl: string;
  timestamp: string;
  isSameSession: boolean;
}

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isRecent(timestamp: string): boolean {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return false;
  return Date.now() - parsed <= MAX_DRAFT_AGE_MS;
}

export const DraftStorage = {
  save(sessionId: string, project: ProjectFile, sourcePreview?: SourcePreview): void {
    if (!hasLocalStorage()) return;

    const normalizedProject = ProjectService.prepareForPersistence(project, sourcePreview);

    const draft: StoredDraft = {
      sessionId,
      project: normalizedProject,
      sourcePreview: normalizedProject.sourcePreview,
      timestamp: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  },

  load(sessionId: string): StoredDraft | null {
    if (!hasLocalStorage()) return null;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as StoredDraft;
      if (!parsed?.project || !parsed?.timestamp || !parsed?.sessionId) return null;
      if (parsed.sessionId !== sessionId && !isRecent(parsed.timestamp)) return null;
      return {
        ...parsed,
        project: ProjectService.validateProjectFile(parsed.project),
        sourcePreview: parsed.sourcePreview,
      };
    } catch {
      return null;
    }
  },

  getSummary(sessionId: string): DraftSummary | null {
    const draft = this.load(sessionId);
    if (!draft) return null;

    return {
      sessionId: draft.sessionId,
      projectName: draft.project.project.name,
      baseUrl: draft.project.project.baseUrl || '',
      timestamp: draft.timestamp,
      isSameSession: draft.sessionId === sessionId,
    };
  },

  clear(): void {
    if (!hasLocalStorage()) return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
