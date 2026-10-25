/**
 * A small demo project used by Help → Load example project.
 *
 * The geometry is in millimetres, drawn in SVG's Y-down coordinates and
 * converted by the normal importer. It contains a plate outline, an inner
 * pocket, and two bolt holes.
 */

export const EXAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="140mm" height="90mm" viewBox="0 0 140 90">
  <rect id="outline" x="10" y="10" width="120" height="70" rx="8" ry="8"/>
  <rect id="pocket" x="30" y="25" width="80" height="40" rx="6" ry="6"/>
  <circle id="hole1" cx="50" cy="45" r="5"/>
  <circle id="hole2" cx="90" cy="45" r="5"/>
</svg>`;
