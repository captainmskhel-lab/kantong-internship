/**
 * drive.ts — Google Drive proof-link helpers (spec §23).
 *
 * Proofs live in the treasurer's Google Drive. We only store the URL and convert
 * shareable links into embeddable /preview links where possible.
 */

const FILE_ID_PATTERNS: RegExp[] = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/FILE_ID/view
  /[?&]id=([a-zA-Z0-9_-]+)/, // ?id=FILE_ID (open?id=, uc?id=)
];

/** Extract the Drive file id from any common Google Drive URL shape. */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  for (const re of FILE_ID_PATTERNS) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.endsWith("drive.google.com") || host.endsWith("docs.google.com");
  } catch {
    return false;
  }
}

/**
 * Convert a Drive view/share link into an embeddable preview link:
 *   https://drive.google.com/file/d/FILE_ID/view  →  .../file/d/FILE_ID/preview
 * Returns null when no preview form is available (caller falls back to a button).
 */
export function toDrivePreviewUrl(url: string): string | null {
  const id = extractDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

/** A normalized proof descriptor for the UI. */
export interface ProofView {
  rawUrl: string;
  previewUrl: string | null;
  canEmbed: boolean;
}

export function buildProofView(url: string | null | undefined): ProofView | null {
  if (!url) return null;
  const previewUrl = toDrivePreviewUrl(url);
  return {
    rawUrl: url,
    previewUrl,
    canEmbed: previewUrl !== null,
  };
}
