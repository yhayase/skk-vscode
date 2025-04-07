# System Patterns: skk-vscode

## System Architecture

The skk-vscode extension follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│              VSCode Layer               │
│  (VSCodeEditor, VSCodeJisyoProvider)    │
├─────────────────────────────────────────┤
│              Core SKK Layer             │
│  (Input Modes, Conversion, Dictionary)  │
├─────────────────────────────────────────┤
│            Abstraction Layer            │
│         (IEditor, IJisyoProvider)       │
└─────────────────────────────────────────┘
```

1. **VSCode Layer** - Handles integration with VSCode APIs
   - Implements editor interactions specific to VSCode
   - Manages VSCode-specific dictionary loading and configuration

2. **Core SKK Layer** - Contains the core SKK functionality
   - Implements input modes and state transitions
   - Handles conversion logic and candidate selection
   - Manages dictionary lookups and registration

3. **Abstraction Layer** - Provides interfaces for editor and dictionary operations
   - Allows for potential future adaptation to other editors
   - Enables testing with mock implementations

## Key Technical Decisions

1. **Mode-Based State Machine**
   - The system uses a state machine pattern for input modes
   - Each mode (Hiragana, Katakana, ASCII, etc.) is a separate class
   - Mode transitions are handled through well-defined events

2. **Editor Abstraction**
   - The IEditor interface abstracts editor operations
   - Allows for testing without actual VSCode dependencies
   - Enables potential future adaptation to other editors

3. **Dictionary System**
   - Multiple dictionary providers can be configured
   - Dictionaries are searched in priority order
   - User dictionary is given highest priority for lookups

4. **Registration Implementation**
   - Registration is implemented as a combination of:
     - A specialized editor tab with a specific format
     - Commands to open and process the registration
     - Logic to insert the registered word back into the original context

## Design Patterns in Use

1. **State Pattern**
   - Input modes are implemented as states
   - Each state handles input differently based on the current mode
   - Transitions between states are explicit and well-defined

2. **Strategy Pattern**
   - Different conversion strategies based on the input context
   - Allows for specialized handling of different conversion scenarios

3. **Factory Pattern**
   - Mode creation is handled through factory methods
   - Ensures proper initialization and configuration of modes

4. **Observer Pattern**
   - Editor events trigger appropriate mode transitions
   - Allows for reactive handling of user input

5. **Command Pattern**
   - VSCode commands are used to trigger specific actions
   - Provides a clean interface for user interactions

## Component Relationships

1. **Input Modes and Conversion**
   - Input modes transition to conversion modes when appropriate
   - Conversion modes handle candidate selection and confirmation
   - After confirmation, control returns to the original input mode

2. **Editor and Modes**
   - Modes use the editor abstraction to manipulate text
   - Editor events trigger mode transitions and actions

3. **Dictionary and Conversion**
   - Conversion modes query dictionaries for candidates
   - Dictionary results determine the available conversion options

4. **Registration and Dictionary**
   - Registration process adds entries to the user dictionary
   - User dictionary entries are immediately available for future conversions

## Critical Implementation Paths

1. **Input to Conversion Flow**
   - User input in kana mode → Conversion trigger → Dictionary lookup → Candidate display → Selection → Confirmation

2. **Registration Flow**
   - No (more) candidates found → Registration editor opens → User inputs word → Registration command → Dictionary update → Word insertion

3. **Mode Transition Flow**
   - Mode-specific key detected → Current mode cleanup → New mode initialization → Editor state update
