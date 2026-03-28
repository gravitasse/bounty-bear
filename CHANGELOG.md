# Changelog

All notable changes to the Bounty Bear project will be documented in this file.

## [1.991.1] - 2026-03-27

### Added - OpenClaw Client Mobile Optimizations

- **Complete Mobile Parity**: OpenClaw client now has all mobile optimizations from main bounty-bear.html
- **Target Card Component**: Added condensed "Positive ID" card that appears on mobile when target is found
- **Mobile State Management**: Implemented `.searching-active`, `.target-found`, `.mobile-compact` states
- **Pulsing Ready Animation**: Bear icon now pulses with green/amber glow when ready for new search
- **Bear Click Reset**: Mobile users can tap bear icon to reset layout and start new search
- **Baseline Alignment**: Search prompt and input text now align on same baseline for clean typography

### Changed - OpenClaw Client

- **Condensed Result Card**: Bear shrinks to 64px in target-found state, reclaiming ~80px for terminal
- **Consistent Padding**: All terminal sections use 16px horizontal padding for alignment
- **Outline over Border**: Bear container uses `outline` to prevent pulse glow clipping
- **Mobile Terminal Sizing**: Optimized font sizes and spacing for maximum readability

### Technical Details

- OpenClaw client (`openclaw/bounty-bear-client.html`) updated to match main file mobile UX
- Desktop version completely untouched - all changes in `@media (max-width: 1024px)` blocks
- SSE streaming integration preserved and enhanced with mobile state callbacks

---

## [1.991.0] - 2026-03-27

### Added
- **Dynamic Mobile Flow**: Complete overhaul of the mobile UI to support a "Cinematic Scaling" experience.
- **Big Bear Search**: Bear icon now scales up to 3x size during active searches for a more dramatic animation.
- **Target Found Badge**: The Positive ID result now appears prominently in the header directly beneath the bear once identified.
- **Ready Pulse**: Added a rhythmic green/amber pulsing animation to the Bear icon to signal manual reset interactability.
- **Manual Reset**: Interaction hook allowing users to click the Bear icon to expand the layout while preserving terminal history.
- **Improved Scoping**: Global result variables ensure location and confidence scores match across both header and terminal logs.

### Changed
- **Flexbox Refactor**: Abandoned CSS Grid for the mobile layout to resolve rendering instabilities in iOS Safari.
- **Responsive Sizing**: Increased base font sizes and tap targets (44px) for better accessibility on smaller screens.
- **Header Optimization**: Reduced the vertical footprint of the static logo to maximize terminal real estate.

### Fixed
- **Safari Layout Breakage**: Resolved an issue where CSS variables inside `calc()` were causing layout collapses on iPhone.
- **Terminal Clipping**: Ensured the terminal output always scrolls to bottom and handles flexible heights correctly in all zoom states.
