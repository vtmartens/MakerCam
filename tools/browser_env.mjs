import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Repository root, derived from this file's location rather than a local absolute path. */
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Absolute file:// URL for a path relative to the repository root. */
export function fileUrl(...parts) {
  return pathToFileURL(path.join(repoRoot, ...parts)).href;
}

/**
 * Chromium-based browser used by the headless UI checks.
 *
 * Set EDGE_PATH (or CHROME_PATH) to use another browser or installation
 * location. Otherwise the usual Microsoft Edge path for the platform is used.
 */
export const executablePath =
  process.env.EDGE_PATH ||
  process.env.CHROME_PATH ||
  (process.platform === 'win32'
    ? path.join(
        process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
        'Microsoft',
        'Edge',
        'Application',
        'msedge.exe',
      )
    : process.platform === 'darwin'
      ? '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
      : '/usr/bin/microsoft-edge');
