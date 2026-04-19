
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ProjectFile, EditableStyleSet, PreviewInfoResponse, AllowedStyleKey, CompatibilityReport } from '../domain/models';
import { PostMessageTransport } from '../infrastructure/transport/PostMessageTransport';
import { PreviewClient } from '../adapters/PreviewClient';
import { ProjectService } from '../domain/projectService';
import { CompatibilityService } from '../domain/compatibilityService';
import { DraftStorage, DraftSummary } from '../infrastructure/storage/draftStorage';
import { canUseIncrementalDefaultMessages, getDefinedStates, getStateStyles, RuntimeStyleState } from '../domain/styleStateHelpers';

export function useEditor(sessionId: string, getPreviewWindow: () => Window | null, getPreviewOrigin: () => string | null) {
  const [project, setProject] = useState<ProjectFile | null>(null);
  const [previewInfo, setPreviewInfo] = useState<PreviewInfoResponse | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedStyleState, setSelectedStyleState] = useState<RuntimeStyleState>('default');
  const [isConnected, setIsConnected] = useState(false);
  const [compatibilityReport, setCompatibilityReport] = useState<CompatibilityReport | null>(null);
  const [availableDraft, setAvailableDraft] = useState<DraftSummary | null>(null);

  const projectRef = useRef<ProjectFile | null>(null);
  const previewRef = useRef<PreviewInfoResponse | null>(null);

  const transport = useMemo(() => new PostMessageTransport(sessionId, getPreviewWindow, getPreviewOrigin), [sessionId, getPreviewWindow, getPreviewOrigin]);
  const client = useMemo(() => new PreviewClient(transport, sessionId), [transport, sessionId]);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    previewRef.current = previewInfo;
  }, [previewInfo]);

  useEffect(() => {
    setAvailableDraft(DraftStorage.getSummary(sessionId));
  }, [sessionId]);

  useEffect(() => {
    const unsub = transport.subscribe((msg) => {
      if (msg.type === 'hello' && msg.source === 'preview') {
        setIsConnected(true);
        client.requestInfo();
      }

      if (msg.type === 'config:request' && msg.source === 'preview') {
        if (projectRef.current) {
          client.sendFullConfig(projectRef.current.config);
        }
      }

      if (msg.type === 'preview:info:response') {
        const info = msg as PreviewInfoResponse;
        setPreviewInfo(info);
        setIsConnected(true);
      }
    });

    client.sendHello();
    client.requestInfo();
    return () => unsub();
  }, [transport, client]);

  useEffect(() => {
    if (!project || !previewInfo) {
      setCompatibilityReport(null);
      return;
    }

    setCompatibilityReport(CompatibilityService.buildReport(project, previewInfo));
  }, [project, previewInfo]);

  useEffect(() => {
    if (!project) return;

    const sourcePreview = previewInfo
      ? CompatibilityService.buildSourcePreview(previewInfo)
      : project.sourcePreview;

    DraftStorage.save(sessionId, project, sourcePreview);
    setAvailableDraft(DraftStorage.getSummary(sessionId));
  }, [sessionId, project, previewInfo]);

  const updateStyle = useCallback((target: string, state: RuntimeStyleState, styles: EditableStyleSet) => {
    if (!project) return;
    const sanitized = ProjectService.sanitizeStyles(styles);
    const nextConfig = ProjectService.updateConfig(project.config, target, sanitized, state);
    setProject(prev => prev ? { ...prev, config: nextConfig } : null);

    if (canUseIncrementalDefaultMessages(project.config[target], state)) {
      client.updateStyle(target, sanitized);
    } else {
      client.sendFullConfig(nextConfig);
    }
  }, [client, project]);

  const removeStyle = useCallback((target: string, state: RuntimeStyleState, key: AllowedStyleKey) => {
    if (!project) return;
    const nextConfig = ProjectService.removeStylesFromConfig(project.config, target, [key], state);
    setProject(prev => prev ? { ...prev, config: nextConfig } : null);

    if (canUseIncrementalDefaultMessages(project.config[target], state)) {
      client.removeStyles(target, [key]);
    } else {
      client.sendFullConfig(nextConfig);
    }
  }, [client, project]);

  const copyStateFromDefault = useCallback((target: string, destinationState: RuntimeStyleState) => {
    if (!project || destinationState === 'default') return;

    const nextConfig = ProjectService.copyStylesFromDefault(project.config, target, destinationState);
    setProject(prev => prev ? { ...prev, config: nextConfig } : null);
    client.sendFullConfig(nextConfig);
  }, [client, project]);

  const selectTarget = useCallback((target: string | null) => {
    setSelectedTarget(target);
    setSelectedStyleState('default');
    client.highlight(target);
  }, [client]);

  const hoverTarget = useCallback((target: string | null) => {
    client.highlight(target);
  }, [client]);

  const createProject = (url: string) => {
    const sourcePreview = previewRef.current ? CompatibilityService.buildSourcePreview(previewRef.current) : undefined;
    const baseProject = ProjectService.createEmptyProject(url);
    const newProject = sourcePreview ? ProjectService.attachSourcePreview(baseProject, sourcePreview) : baseProject;
    setProject(newProject);
    setAvailableDraft(null);
    client.notifyProjectLoad(newProject.project);
    if (previewRef.current) {
      client.sendFullConfig(newProject.config);
    }
  };

  const loadProject = (data: any) => {
    const validated = ProjectService.validateProjectFile(data);
    setProject(validated);
    setAvailableDraft(null);
    if (previewRef.current) {
      client.sendFullConfig(validated.config);
    }
  };

  const restoreDraft = useCallback(() => {
    const draft = DraftStorage.load(sessionId);
    if (!draft) {
      setAvailableDraft(null);
      return;
    }

    setProject(draft.project);
    setSelectedTarget(null);
    setAvailableDraft(null);
    if (previewRef.current) {
      client.sendFullConfig(draft.project.config);
    }
  }, [client, sessionId]);

  const discardDraft = useCallback(() => {
    DraftStorage.clear();
    setAvailableDraft(null);
  }, []);

  return {
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
    createProject,
    loadProject,
    restoreDraft,
    discardDraft,
    getEditableStyles: (target: string) => project ? getStateStyles(project.config[target], 'default') : {},
    getEditableStylesForState: (target: string, state: RuntimeStyleState) => project ? getStateStyles(project.config[target], state) : {},
    getDefinedStatesForTarget: (target: string) => project ? getDefinedStates(project.config[target]) : [],
  };
}
