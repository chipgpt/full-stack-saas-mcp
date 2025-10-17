import { useSyncExternalStore } from 'react';

/**
 * Hooks
 */

export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(key: K): OpenAiGlobals[K] | null {
  return useSyncExternalStore(
    onChange => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const handleSetGlobal = (event: SetGlobalsEvent) => {
        const value = event.detail.globals[key];
        if (value === undefined) {
          return;
        }

        onChange();
      };

      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal, {
        passive: true,
      });

      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal);
      };
    },
    () => window.openai?.[key] ?? null,
    () => window.openai?.[key] ?? null
  );
}

export type OpenAiGlobals<
  ToolInput = {},
  ToolOutput = {},
  ToolResponseMetadata = {},
  WidgetState = {}
> = {
  // visuals
  theme: Theme;

  userAgent: UserAgent;
  locale: string;

  // layout
  maxHeight: number;
  displayMode: DisplayMode;
  safeArea: SafeArea;

  // state
  toolInput: ToolInput;
  toolOutput: ToolOutput | null;
  toolResponseMetadata: ToolResponseMetadata | null;
  widgetState: WidgetState | null;
  setWidgetState: (state: WidgetState) => Promise<void>;
};

// currently copied from types.ts in chatgpt/web-sandbox.
// Will eventually use a public package.
type API = {
  callTool<TResponse extends { [key: string]: unknown }>(
    name: string,
    args: Record<string, unknown>
  ): Promise<CallToolResponse<TResponse>>;
  sendFollowUpMessage: (args: { prompt: string }) => Promise<void>;
  openExternal(payload: { href: string }): void;

  // Layout controls
  requestDisplayMode: RequestDisplayMode;
};

export type Theme = 'light' | 'dark';

export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type SafeArea = {
  insets: SafeAreaInsets;
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export type UserAgent = {
  device: { type: DeviceType };
  capabilities: {
    hover: boolean;
    touch: boolean;
  };
};

/** Display mode */
export type DisplayMode = 'pip' | 'inline' | 'fullscreen';
export type RequestDisplayMode = (args: { mode: DisplayMode }) => Promise<{
  /**
   * The granted display mode. The host may reject the request.
   * For mobile, PiP is always coerced to fullscreen.
   */
  mode: DisplayMode;
}>;

export type CallToolResponse<TResponse extends { [key: string]: unknown }> = {
  result: string;
  structuredContent: TResponse;
};

/** Extra events */
export const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals';
export class SetGlobalsEvent extends CustomEvent<{
  globals: Partial<OpenAiGlobals>;
}> {
  readonly type = SET_GLOBALS_EVENT_TYPE;
}

/**
 * Global oai object injected by the web sandbox for communicating with chatgpt host page.
 */
declare global {
  interface Window {
    openai: API & OpenAiGlobals;
  }

  interface WindowEventMap {
    [SET_GLOBALS_EVENT_TYPE]: SetGlobalsEvent;
  }
}
