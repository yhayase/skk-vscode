# Progress: skk-vscode

## What Works

### Core Input Functionality
- [x] Hiragana mode (ひらがなモード)
- [x] Katakana mode (カタカナモード)
- [x] ASCII mode (半角英数モード)
- [x] Zenkaku mode (全角英数モード)
- [x] Abbrev mode (スラッシュ記号で英数字での見出し語検索)
- [x] Mode transitions following SKK conventions

### Conversion Functionality
- [x] Basic kana-to-kanji conversion
- [x] Inline display of first 3 candidates
- [x] Menu display for additional candidates
- [x] Okurigana (送り仮名) handling
- [x] Candidate selection and confirmation
- [x] Candidate prioritization based on selection history
- [x] Candidate deletion with confirmation dialog

### Dictionary Management
- [x] Multiple dictionary support
- [x] Dictionary configuration through settings
- [x] Postal code dictionary support
- [x] Dictionary search in priority order
- [x] Candidate deletion with confirmation dialog
- [x] Integration tests for dictionary operations

### Registration Feature (In Progress)
- [x] Opening registration editor from InlineHenkanMode
- [x] Opening registration editor from MenuHenkanMode
- [x] Opening registration editor from MidashigoMode
- [x] Proper formatting of registration editor content
- [x] Converting katakana readings to hiragana in the editor
- [x] Registration command to add entries to the user dictionary
- [x] Closing registration editor after registration
- [x] Returning focus to the original editor
- [x] Inserting registered word at cursor position
- [x] Integration tests for registration feature
- [ ] Dedicated mode for registration editor
- [ ] Keyboard shortcut for registration command

### Keybinding Contextualization (Issue #55) - Basic Implementation
- [x] Core logic in `lib/skk` modes to define active keys (`getActiveKeys`) and contextual names (`getContextualName`) (partially implemented across key modes).
- [x] `VSCodeEditor` updated to manage and set `skk.mode` and `skk.activeKey.*` contexts.
- [x] `package.json` keybindings updated to use these new contexts.
- [x] Helper utilities in `keyUtils.ts` for key name normalization and context key generation.
- [x] Unit tests for `getActiveKeys` in some modes.
- [x] Existing integration tests pass with these changes.

## What's Left to Build

### Candidate Deletion Enhancement
- [ ] Add keyboard shortcut documentation for deletion feature
- [ ] Consider menu-based deletion for multiple candidates
- [ ] Add undo functionality for accidental deletions
- [ ] Improve error handling for deletion operations

### Registration Feature Completion
- [ ] Implement dedicated registration mode
- [ ] Add specialized key handling for registration mode
- [ ] Improve error handling for invalid registration inputs
- [ ] Refactor duplicate code in registration editor opening logic
- [ ] Update documentation for registration feature

### Keybinding Contextualization (Issue #55) - Remaining Tasks
- [~] Complete implementation of `getActiveKeys()` and `getContextualName()` for **all** input mode classes and their internal states.
- [~] Add comprehensive unit tests for `getActiveKeys()` and `getContextualName()` for all modes.
- [ ] Create new integration tests specifically for verifying `skk.mode` and `skk.activeKey.*` context values and their effect on keybinding activation.
- [ ] Conduct thorough manual testing and debugging of keybinding behavior in all modes and scenarios.
- [ ] Performance review of the context update mechanism.

### Additional Features
- [ ] Improved candidate display for long lines
- [ ] Enhanced dictionary management
- [ ] Performance optimizations for large dictionaries
- [ ] Additional customization options

### Quality Improvements
- [ ] Additional test coverage
- [ ] Documentation updates
- [ ] Performance profiling and optimization
- [ ] Accessibility improvements

## Current Status

### Version
- Current version: 0.0.2
- Next planned version: 0.0.3 (with registration and candidate deletion features)

### Development Status
- Active development on candidate deletion and registration features.
- **Basic implementation for Issue #55 (Keybinding Contextualization) is complete.** Remaining work involves full mode coverage and targeted testing.
- Core functionality is stable and working.
- Existing integration tests pass with recent changes.

### Known Issues
- Conversion candidate menu is displayed at the beginning of the line, which can be problematic for long lines
- No dedicated mode for registration editor yet
- Some code duplication in registration editor opening logic
- No undo functionality for candidate deletion yet

## Evolution of Project Decisions

### Initial Design (v0.0.1)
- Focus on core input and conversion functionality
- Simple dictionary system with single dictionary
- Basic mode transitions

### Current Design (v0.0.2)
- Added multiple dictionary support
- Implemented Abbrev mode for postal code lookup
- Enhanced conversion candidate handling
- Started work on registration feature
- Implemented candidate deletion functionality

### Future Direction
- Complete registration feature with dedicated mode
- Improve user experience for candidate selection
- Enhance dictionary management
- Consider additional SKK features from DDSKK

## Milestone Progress

### Milestone 1: Basic Input (Completed)
- Implemented core input modes
- Added basic conversion functionality
- Released as v0.0.1

### Milestone 2: Enhanced Dictionary Support (Completed)
- Added multiple dictionary support
- Implemented Abbrev mode
- Released as v0.0.2

### Milestone 3: Dictionary Management & Keybinding Robustness (In Progress)
- Implementing dictionary registration
- Implementing candidate deletion
- **Basic implementation for contextual keybinding (Issue #55) complete.**
- Adding tests for dictionary operations and keybinding (ongoing for Issue #55).
- Planned for v0.0.3

### Milestone 4: Refinement (Planned)
- Improve user experience
- Enhance performance
- Add additional customization options
