declare module 'ssrfcheck' {
  /**
   * Check if a URL is safe for SSRF attacks
   *
   * default config is:
   * ```
   * {
   *   quiet: true,
   *   noIP: false,
   *   allowUsername: false,
   *   allowUnsafeChars: false,
   *   autoPrependProtocol: 'https',
   *   allowedProtocols: [ 'http', 'https' ],
   * }
   * ```
   */
  export function isSSRFSafeURL(
    url: string,
    options?: Partial<{
      quiet: boolean;
      noIP: boolean;
      allowUsername: boolean;
      allowedProtocols: string[];
      autoPrependProtocol: string | false;
      allowUnsafeChars: boolean;
    }>
  ): boolean;
}
