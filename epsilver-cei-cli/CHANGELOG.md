# Changelog

All notable changes to `epsilver-cei-cli` are documented here.

## [0.2.0] - 2026-03-10
### Added
- GovTrack legislative data integration for political figures
- Ideology percentile mapped to Justice/Tradition axes (roll-call vote analysis)
- Leadership percentile mapped to Establishment axis
- Strong/extreme ideology thresholds mapped to Conflict and Rigidity axes
- Party affiliation fallback signal when no roll-call ideology score is available
- Political occupation detection gates GovTrack lookups (politicians, senators, judges, activists, etc.)
- GovTrack fetch runs in parallel with image resolution for faster pipeline execution
- GDELT news integration as a third scoring pass (supplementing Wikipedia lead + views section)
- `govtrackApplied` flag persisted to model readout in profile JSON

### Fixed
- Conflict and Rigidity glossary entries: curly-quote attribute delimiters replaced with ASCII quotes

### Changed
- Signal wheel tooltip: square corners, no redundant sub-label, full axis names for abbreviated labels
- Tooltip suppressed on touch/mobile devices (mouse-only via pointerType check)
- Profile portrait stacked above name and summary on mobile
- Lean pill redesigned as colored badge
- Monochrome lean pill colors; Chud pill highlighted red
- Profile page margins and font sizes adjusted for mobile

## [0.1.0] - 2026-03-08
### Added
- Self-hosted Inter font via fontsource
- Twitter/OG meta images and pentagon favicon
- Axis headings styled with section-title class
- Radar signal wheel on profile cards

### Changed
- Darkened muted text for readability
- Adjusted inline bold and small font sizes

## [0.0.1] - 2026-03-07
### Added
- Initial commit
- Wikipedia lead + infobox scoring pipeline
- Five-axis CEI signal wheel (Establishment, Justice, Tradition, Conflict, Rigidity)
- Heuristic keyword clustering
- Confidence scoring and status derivation
- GitHub Pages deployment
- Profile, home, compare, and methodology pages
