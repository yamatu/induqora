// Unified 1200x640 light-canvas editorial frame & dispatcher for all Induqora engineering diagrams.
import { renderDiagramBodyA } from "./render-diagrams-a.mjs";
import { renderDiagramBodyB } from "./render-diagrams-b.mjs";
import { renderDiagramBodyC } from "./render-diagrams-c.mjs";
import { renderDiagramBodyD } from "./render-diagrams-d.mjs";
import { renderDiagramBodyE } from "./render-diagrams-e.mjs";
import { renderDiagramBodyF } from "./render-diagrams-f.mjs";
import { renderDiagramBodyG } from "./render-diagrams-g.mjs";
import { renderDiagramBodyH } from "./render-diagrams-h.mjs";
import { renderDiagramBodyI } from "./render-diagrams-i.mjs";

const SANS = "DejaVu Sans, sans-serif";
const MONO = "DejaVu Sans Mono, monospace";

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fixBareAmps(svg) {
  return svg.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;");
}

export function renderDiagramSvg(article, diagramOverride) {
  const d = diagramOverride || article.diagram;
  // Check D, C and A before B because B has a trailing default fallback for advisory-mitigation.
  const body =
    renderDiagramBodyI(d) ?? renderDiagramBodyH(d) ?? renderDiagramBodyG(d) ?? renderDiagramBodyF(d) ?? renderDiagramBodyE(d) ?? renderDiagramBodyD(d) ?? renderDiagramBodyC(d) ?? renderDiagramBodyA(d) ?? renderDiagramBodyB(d);
  if (!body) throw new Error(`Unknown diagram type: ${d.type}`);
  const figLabel = d.figLabel || "FIG. 1";

  return fixBareAmps(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640" viewBox="0 0 1200 640">
  <defs>
    <marker id="arrDark" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569"/>
    </marker>
    <marker id="arrBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0b5cad"/>
    </marker>
    <marker id="arrGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669"/>
    </marker>
    <marker id="arrRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626"/>
    </marker>
  </defs>

  <!-- Outer Card Background -->
  <rect width="1200" height="640" fill="#ffffff"/>
  <rect x="0.5" y="0.5" width="1199" height="639" fill="none" stroke="#e2e8f0" stroke-width="1"/>

  <!-- Editorial Header Bar -->
  <rect x="0" y="0" width="1200" height="94" fill="#f8fafc"/>
  <rect x="0" y="0" width="1200" height="5" fill="#0b5cad"/>
  <rect x="0" y="0" width="180" height="5" fill="#f59e0b"/>
  <line x1="0" y1="94" x2="1200" y2="94" stroke="#e2e8f0" stroke-width="1.5"/>

  <text x="44" y="44" fill="#0f172a" font-family="${SANS}" font-size="22" font-weight="bold">${esc(d.title)}</text>
  <text x="44" y="72" fill="#475569" font-family="${SANS}" font-size="13.5">${esc(d.subtitle)}</text>

  <!-- Right Brand Tag -->
  <rect x="974" y="24" width="182" height="28" rx="6" fill="#0f172a"/>
  <rect x="984" y="31" width="5" height="14" rx="1.5" fill="#f59e0b"/>
  <text x="998" y="43" fill="#ffffff" font-family="${MONO}" font-size="11" font-weight="bold">INDUQORA · ${esc(figLabel)}</text>

  <!-- Diagram Body -->
  ${body}

  <!-- Editorial Footer Bar -->
  <rect x="0" y="584" width="1200" height="56" fill="#f8fafc"/>
  <line x1="0" y1="584" x2="1200" y2="584" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="44" y="617" fill="#64748b" font-family="${SANS}" font-size="12">Source: ${esc(d.source)}</text>
  <text x="1156" y="617" text-anchor="end" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">www.induqora.com</text>
</svg>`);
}
