export {};

declare global {
  interface Window {
    __previewHarness?: {
      messages: Array<Record<string, unknown>>;
      previewRef: Window | null;
    };
    __CSS_EDITOR_PREVIEW_CONFIG__?: {
      siteKey?: string;
      siteName?: string;
      debug?: boolean;
    };
  }
}
