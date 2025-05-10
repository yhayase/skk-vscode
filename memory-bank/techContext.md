# Technical Context: skk-vscode

## Technologies Used

1. **TypeScript**
   - Primary development language
   - Provides type safety and modern JavaScript features
   - Used for all extension code

2. **VSCode Extension API**
   - Used for integration with VSCode editor
   - Provides editor manipulation capabilities
   - Handles command registration and execution

3. **Node.js**
   - Runtime environment for the extension
   - Used for file system operations (dictionary loading)

4. **Mocha & Chai**
   - Testing frameworks used for unit and integration tests
   - Enables test-driven development approach

## Development Setup

1. **Project Structure**
   - `/src`: Source code
     - `/extension.ts`: Extension entry point
     - `/VSCodeEditor.ts`: VSCode-specific editor implementation
     - `/VSCodeJisyoProvider.ts`: VSCode-specific dictionary provider
     - `/lib/skk/`: Core SKK functionality
       - `/input-mode/`: Input mode implementations
       - `/input-mode/henkan/`: Conversion mode implementations
       - `/jisyo/`: Dictionary-related implementations
       - `/editor/`: Editor abstraction layer
   - `/test`: Test code
     - `/unit`: Unit tests
     - `/integration`: Integration tests

2. **Build System**
   - Uses webpack for bundling
   - TypeScript compilation configured in tsconfig.json
   - Separate tsconfig.build.json for production builds

3. **Testing Environment**
   - Unit tests for core functionality
   - Integration tests for VSCode-specific features
   - E2E tests for complete workflows

## Technical Constraints

1. **VSCode Extension Limitations**
   - Limited UI customization capabilities
   - Restricted access to editor internals
   - Performance considerations for extension code

2. **Dictionary Performance**
   - Large dictionaries must be loaded and searched efficiently
   - Memory usage must be managed carefully

3. **Input Handling**
   - Must work with VSCode's input system
   - Need to handle key events appropriately
   - Potential conflicts with other extensions or VSCode keybindings

## Dependencies

1. **Core Dependencies**
   - VSCode Extension API
   - Node.js standard library

2. **Development Dependencies**
   - TypeScript
   - Webpack
   - ESLint
   - Mocha & Chai for testing

## Tool Usage Patterns

1. **VSCode Commands**
   - Extension functionality is exposed through VSCode commands
   - Commands are registered in the extension activation
   - Commands follow the pattern `skk.<action>Input` for consistency

2. **Editor Manipulation**
   - Text insertion and deletion through the editor abstraction
   - Position tracking for cursor and selection management
   - Decoration handling for visual feedback

3. **Dictionary Access**
   - Dictionary providers implement the IJisyoProvider interface
   - Dictionary entries are cached for performance
   - User dictionary is persisted between sessions
   - Dictionary operations include lookup, registration, and deletion

4. **Testing Approach**
   - Unit tests for core logic
   - Integration tests for VSCode-specific functionality
   - E2E tests for complete workflows
   - Test-driven development for new features
