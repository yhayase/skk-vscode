# Active Context: skk-vscode

## Current Work Focus

The current development focus is on:
- Implementing the **candidate deletion feature**
- Completing the **dictionary registration feature**
- **Keybinding contextualization and optimization (Issue #55)**: Implementing fine-grained keybinding control using VSCode's `when` clause contexts to ensure the extension only handles necessary key events based on the current SKK mode. This aims to improve compatibility with other extensions and VSCode's native functionalities.

The candidate deletion feature allows users to delete unwanted candidates from their dictionary during conversion. This is useful for removing incorrect or outdated entries.

The dictionary registration feature allows users to add new word-reading pairs to their user dictionary when a conversion candidate is not found or when they want to add a new entry.

### Registration Feature Implementation

The registration feature is not implemented as a separate "mode" like the input modes, but rather as a combination of three elements:

1. **Registration Editor Tab**
   - A specialized editor tab with a specific format
   - Contains the reading and an empty field for the word
   - Format: `読み:{reading}\n単語:`

2. **Registration Trigger**
   - Triggered when:
     - In InlineHenkanMode, moving past the last candidate
     - In MenuHenkanMode, moving past the last candidate
     - In MidashigoMode, when no candidates are found

3. **Registration Command**
   - VSCode command to process the registration
   - Extracts reading and word from the editor
   - Adds the entry to the user dictionary
   - Closes the registration editor
   - Returns focus to the original editor
   - Inserts the registered word at the cursor position

## Recent Changes

1. **Candidate Deletion Implementation**
   - Implemented CandidateDeletionMode for handling candidate deletion
   - Added confirmation dialog for deletion (Y/N prompt)
   - Implemented dictionary entry removal functionality
   - Added support for deletion in different input contexts (hiragana, katakana, okurigana)

2. **Registration Editor Opening**
   - Implemented opening the registration editor from InlineHenkanMode
   - Implemented opening the registration editor from MenuHenkanMode
   - Implemented opening the registration editor from MidashigoMode

3. **Registration Content Handling**
   - Implemented proper formatting of the registration editor content
   - Added support for converting katakana readings to hiragana in the editor

4. **Registration Command**
   - Implemented the registration command to add entries to the user dictionary
   - Added logic to close the registration editor after registration
   - Implemented focus return to the original editor
   - Added word insertion at the cursor position after registration

5. **Testing**
   - Added integration tests for the candidate deletion feature
   - Added integration tests for the registration feature
   - Implemented tests for different registration scenarios
   - Added tests for okurigana handling in registration and deletion

## Next Steps

**Issue #55: Keybinding Contextualization**
1.  **Design Custom Contexts**: Define `when` clause contexts for SKK modes (e.g., `skk.mode`) and active keys (e.g., `skk.activeKey.[KeyCode]`).
2.  **Update `lib/skk`**: Modify core SKK logic to expose currently active keys for each mode.
3.  **Implement Context Updates**: In the VSCode extension layer, fetch active keys from `lib/skk` and update `when` clause contexts using `setContext`.
4.  **Refactor `package.json`**: Update keybinding definitions to use the new contexts.
5.  **Testing**: Implement unit tests for `lib/skk` key exposure and integration tests for context updates and keybinding behavior.

**Existing Next Steps**
1. **Candidate Deletion Enhancement**
   - Add keyboard shortcut documentation for the deletion feature
   - Consider adding a menu-based deletion option for multiple candidates
   - Improve error handling for deletion operations

2. **Registration Mode Implementation**
   - Implement a dedicated mode for the registration editor
   - Add specialized key handling for the registration mode

3. **Registration Command Enhancement**
   - Add support for executing the registration command with a keyboard shortcut
   - Improve error handling for invalid registration inputs

4. **Refactoring**
   - Refactor duplicate code in registration editor opening logic
   - Improve the architecture of the registration feature

5. **Documentation**
   - Update documentation to include both the registration and deletion features
   - Add usage examples for both workflows

## Active Decisions and Considerations

**Issue #55: Keybinding Contextualization**
-   **Context Design**:
    -   `skk.mode`: String representing the current SKK mode (e.g., `hiragana`, `katakana`, `henkan`, `ascii`, `disabled`).
    -   `skk.activeKey.[NORMALIZED_KEY_NAME]`: Boolean, true if `NORMALIZED_KEY_NAME` (e.g., `Space`, `Ctrl+J`, `Enter`) is active in the current `skk.mode`.
-   **Performance**: Monitor the frequency of `setContext` calls and their impact on VSCode performance. Avoid overly granular updates if they cause noticeable slowdowns.
-   **Key Name Normalization**: Establish a consistent way to represent key names between `package.json` keybindings and `lib/skk` logic.
-   **Coverage**: Ensure all relevant SKK states and key interactions are covered by the new context logic.
-   **Fallback/Default Behavior**: Define how keybindings should behave if a context is not set or is in an unexpected state.

1. **Candidate Deletion Workflow**
   - Using 'X' key during conversion to trigger deletion mode
   - Requiring explicit confirmation (Y/N) to prevent accidental deletions
   - Considering whether to add an undo feature for deletions

2. **Registration Editor Format**
   - Using a simple text format for the registration editor
   - Considering whether to add more structure or validation

3. **Registration Workflow**
   - Current workflow follows SKK conventions
   - Evaluating if any VSCode-specific improvements could be made

4. **Performance Considerations**
   - Monitoring the performance impact of dictionary updates
   - Ensuring smooth user experience during registration and deletion

5. **Testing Strategy**
   - Using integration tests to verify the complete workflows
   - Considering additional unit tests for specific components

## Important Patterns and Preferences

1. **Command-Based Interaction**
   - Using VSCode commands for user interactions
   - Following the established pattern of `skk.<action>` for command naming

2. **Editor Abstraction**
   - Continuing to use the editor abstraction for all text manipulations
   - Ensuring registration and deletion features work through the abstraction layer

3. **Mode-Based State Machine**
   - Adding new modes (like CandidateDeletionMode) to handle specific interactions
   - Maintaining clear transitions between modes

4. **Test-Driven Development**
   - Implementing tests alongside or before feature implementation
   - Using tests to verify correct behavior across different scenarios

## Learnings and Project Insights

1. **VSCode Editor Limitations**
   - Working around limitations in VSCode's editor API
   - Finding creative solutions for SKK-style interactions

2. **State Management Complexity**
   - Managing the complex state transitions between modes
   - Ensuring proper cleanup and initialization during transitions
   - Adding new modes (like CandidateDeletionMode) increases complexity but improves user experience

3. **Dictionary Management**
   - Balancing between dictionary flexibility and performance
   - Implementing both addition and deletion operations for complete dictionary management

4. **Testing Challenges**
   - Addressing challenges in testing asynchronous editor operations
   - Developing reliable test patterns for VSCode extension features
   - Creating comprehensive tests for complex user interactions
