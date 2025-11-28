# LUMEN — Client‑Side EVTX Threat Workbench

LUMEN (Log Understanding and Malware Event Navigator) is a browser-based Windows Event Log analyzer that stays entirely on your machine. Load EVTX files, run curated SIGMA detections, correlate activity into storylines, extract IOCs, and export findings—without sending logs anywhere.

## What it does
- **Guided investigations**: A collapsible side-rail keeps you on track from ingest → detections → correlation → export.
- **Curated SIGMA loads**: Pick platform (Windows/Linux/macOS/Cloud/Network) and filter rule categories before loading to reduce noise and speed up matching.
- **Detection & triage**: Severity-tagged matches with cached results across views; supports large-but-reasonable files with warnings above 25k events.
- **Correlation & story view**: Chains related events, with a narrative “Storyline” tab for fast triage and a detailed chain view with process context.
- **IOC extraction + VT integration**: Pull IPs/domains/hashes/paths/URLs/registry keys; optional VirusTotal lookups with API key input.
- **Dashboards & timeline**: High-level dashboards, process analysis, and a SIGMA-aware timeline for sequence analysis.
- **Sessions & exports**: Save/restore sessions locally (no server), export reports, and use built-in sample data for demos.
- **Privacy by design**: 100% client-side (WASM + JS); no telemetry, no uploads.

## Quickstart
```bash
git clone https://github.com/Koifman/LUMEN.git
cd LUMEN
npm install
npm run dev  # app at http://localhost:5173
```

Build for production:
```bash
npm run build
```

## Workflow
1) **Upload logs**: Drag/drop EVTX or load samples. File size limit: 500MB. Supports both binary EVTX and XML exports.
2) **Select analysis**: SIGMA Detection, Event Correlation, Dashboards, Timeline, IOC Extraction, Raw Logs, AI Analysis.
3) **Load SIGMA**: Choose platform and (optionally) categories; rules load dynamically and cache for the session.
4) **Investigate**:
   - Detections: severity-filtered results with rule details.
   - Correlation: Analyzes events with SIGMA matches (+ context events); chain list + Storyline summary for fast triage.
   - IOC Extraction: categorized indicators, VT lookup buttons, export IOCs.
   - Dashboards/Timeline/Process views: aggregated and time-sequenced perspectives.
   - AI Analysis: Optional AI-powered analysis using Anthropic Claude, OpenAI, or Google Gemini.
5) **Export or save**: Generate reports or save a session locally to resume later.

## Architecture (high level)
- **React + Vite** frontend; heavy views lazy-loaded to trim initial bundle.
- **SIGMA engine** (`src/lib/sigma/`): parser, compiler, matcher with platform/category-scoped loading from `src/sigma-master`.
- **Correlation engine** (`src/lib/correlationEngine.ts`): links SIGMA-matched events (+ ±1 context) into chains using process/temporal relationships. Limited to 50K events for performance.
- **EVTX parsing**: WASM-backed parsing (using evtx Rust library) with chunked processing for large files; supports both binary EVTX and XML exports.
- **Persistence**: `localStorage`-based session save/restore (metadata index + compressed payload).
- **Security**: All computation in-browser; optional VT enrichment and AI analysis via user-supplied API keys.

## Configuration tips
- **Rule filtering**: Use the platform selector’s category checkboxes to cut load time and reduce false positives.
- **Performance guards**: Avoid reloading rules unless platform/categories change; correlation can be skipped when there are zero SIGMA matches.
- **Privacy**: VT calls are off unless a key is provided; everything else stays local.

## Testing & samples
- Built-in sample loader plus `samples/EVTX-ATTACK-SAMPLES` for quick demos.
- (Suggested) Add a small regression EVTX + expected detections to `npm test` for parser/matcher sanity checks.

## Roadmap (shortlist)
- Rule authoring/validation in-app.
- ATT&CK mapping overlays in detections and storyline.
- Worker offload for matching/correlation on very large files.
- Single-chain export (PDF/MD) for quick sharing.

## License
MIT — see [LICENSE](LICENSE).
