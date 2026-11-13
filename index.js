/**
 * Host half of the Job output tab bundle. Every contribution is browser-side:
 * the Client module registers the conversation view, the job tool cards, and
 * the locale dictionaries. This row exists so the package appears as an
 * ordinary Loader entry.
 * @module @local/job-log
 */

/** Loader-visible no-op body; the browser half carries the feature. */
export function apply() {}
