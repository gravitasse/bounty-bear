# Changelog

All notable changes to the Bounty Bear project will be documented in this file.

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
