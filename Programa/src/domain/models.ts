
export const ALLOWED_CSS_PROPERTIES = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'textTransform',
  'textDecoration',
  'lineHeight',
  'letterSpacing',
  'color',
  'backgroundColor',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'borderColor',
  'borderWidth',
  'borderRadius',
  'objectFit',
  'objectPosition',
] as const;

export type AllowedStyleKey = (typeof ALLOWED_CSS_PROPERTIES)[number];

export interface EditableStyleSet extends Partial<Record<AllowedStyleKey, string>> {}

export interface StatefulStyleSet {
  default?: EditableStyleSet;
  hover?: EditableStyleSet;
  focus?: EditableStyleSet;
  active?: EditableStyleSet;
  disabled?: EditableStyleSet;
  selected?: EditableStyleSet;
  open?: EditableStyleSet;
}

export type StyleConfigValue = EditableStyleSet | StatefulStyleSet;

export interface StyleConfig {
  [target: string]: StyleConfigValue;
}

export interface ProjectInfo {
  projectId: string;
  name: string;
  baseUrl?: string;
  siteKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourcePreview {
  protocolVersion: number;
  moduleVersion?: string;
  page: {
    url: string;
    origin: string;
    title?: string;
  };
  site?: {
    siteKey?: string;
    siteName?: string;
    environment?: string;
  };
  editable?: {
    knownTargets?: string[];
    count?: number;
  };
  capturedAt: string;
}

export type CompatibilitySeverity = 'ok' | 'warning' | 'error';

export interface CompatibilityReport {
  protocolCompatible: boolean;
  siteCompatible: boolean;
  urlCompatible: boolean | null;
  missingTargetsInPreview: string[];
  newTargetsInPreview: string[];
  severity: CompatibilitySeverity;
  messages: string[];
}

export interface ProjectFile {
  schemaVersion: number;
  project: ProjectInfo;
  sourcePreview?: SourcePreview;
  config: StyleConfig;
}

export interface LegacySourcePreview {
  protocolVersion: number;
  moduleVersion?: string;
  url: string;
  origin?: string;
  title?: string;
  siteKey?: string;
  siteName?: string;
  knownTargets?: string[];
}

// Missatges del protocol
export type MessageSource = 'editor' | 'preview';

export interface BaseMessage {
  type: string;
  sessionId: string;
  source: MessageSource;
  timestamp: number;
}

export interface PreviewInfoResponse extends BaseMessage {
  type: 'preview:info:response';
  protocolVersion: number;
  moduleVersion: string;
  page: {
    url: string;
    origin: string;
    title: string;
  };
  site: {
    siteKey: string;
    siteName: string;
    environment?: string;
  };
  editable: {
    targets: string[];
    count: number;
  };
}

export type ProtocolMessage = 
  | BaseMessage 
  | PreviewInfoResponse 
  | { type: 'hello' } & BaseMessage
  | { type: 'config:request' } & BaseMessage
  | { type: 'project:load'; project: ProjectInfo } & BaseMessage
  | { type: 'style:update'; target: string; styles: EditableStyleSet } & BaseMessage
  | { type: 'style:remove'; target: string; keys: AllowedStyleKey[] } & BaseMessage
  | { type: 'highlight'; target: string | null } & BaseMessage
  | { type: 'config:replaceAll'; config: StyleConfig } & BaseMessage;
