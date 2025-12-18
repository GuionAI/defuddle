import { Defuddle } from './defuddle';
export type { DefuddleOptions, DefuddleResponse, DefuddleMetadata } from './types';

/**
 * Parse HTML string and extract main content.
 * Convenience function that wraps Defuddle.parse().
 *
 * @example
 * ```typescript
 * import { parse } from '@flicknote/defuddle';
 * const result = parse(html, { url: 'https://example.com' });
 * ```
 */
export const parse = Defuddle.parse.bind(Defuddle);

// Named export
export { Defuddle };

// Export Defuddle as default
export default Defuddle; 