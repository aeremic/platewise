/**
 * Public app information shown in the app (Settings → About) and in the store listings.
 * `npm run release:check` fails while the support email is still the placeholder.
 */

/** Public support contact. TODO(owner): replace with the dedicated support address before release. */
export const SUPPORT_EMAIL = 'replace-me@example.com';

/** GitHub Pages site built from docs/ in this repo. */
export const WEBSITE_URL = 'https://aeremic.github.io/platewise/';
export const PRIVACY_POLICY_URL = 'https://aeremic.github.io/platewise/privacy.html';

/**
 * USDA "Look up" stays off until the app has an official api.data.gov key; a personal key must
 * not ship inside store builds. To turn it on for a build, set both
 * EXPO_PUBLIC_USDA_LOOKUP=enabled and EXPO_PUBLIC_FDC_API_KEY=<key> (e.g. as EAS environment
 * variables) and rebuild. "Ask AI" (Google AI Mode) needs no key and stays available.
 */
export const USDA_LOOKUP_ENABLED =
  process.env.EXPO_PUBLIC_USDA_LOOKUP === 'enabled' && Boolean(process.env.EXPO_PUBLIC_FDC_API_KEY);
