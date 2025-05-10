# Product Context: skk-vscode

## Why This Project Exists

The skk-vscode project exists to provide a Japanese input method that:

1. **Works natively within VSCode** - Allows developers to input Japanese text without switching to external IME systems
2. **Follows SKK conventions** - Provides a familiar experience for users of the SKK input method from Emacs
3. **Optimizes for coding workflows** - Designed with programming tasks in mind, unlike general-purpose IMEs

## Problems It Solves

1. **Context Switching** - Reduces the need to switch between VSCode and external IME systems, maintaining focus on coding tasks
2. **IME Conflicts** - Avoids conflicts between external IME systems and VSCode keybindings
3. **Coding-Specific Input** - Provides an input method optimized for programming contexts where Japanese text is needed

## How It Should Work

The extension should provide a seamless Japanese input experience within VSCode:

1. **Mode-Based Input**
   - Users toggle between different input modes (Hiragana, Katakana, ASCII, Zenkaku)
   - Mode transitions follow SKK conventions (e.g., Ctrl+J to switch from ASCII to Hiragana)

2. **Conversion Process**
   - Romaji input is converted to kana in real-time
   - Kana can be converted to kanji through dictionary lookups
   - Conversion candidates are displayed inline (first 3) or in a menu (4+)
   - Okurigana (送り仮名) handling follows SKK conventions

3. **Dictionary System**
   - Multiple dictionaries can be configured and searched
   - User dictionary allows for personalization
   - Dictionary registration allows adding new word-reading pairs
   - Dictionary management allows removing unwanted entries

4. **Dictionary Management Workflow**
   - Registration:
     - When a conversion candidate is not found, a registration editor opens
     - Users input the desired word for the reading
     - Upon registration, the word is added to the user dictionary and inserted at the cursor position
   - Deletion:
     - During conversion, users can press 'X' to enter deletion mode
     - A confirmation prompt (Y/N) is displayed
     - Upon confirmation, the entry is removed from the dictionary

## User Experience Goals

1. **Minimal Disruption** - The input method should not interrupt the coding flow
2. **Predictable Behavior** - Follow SKK conventions where possible for consistency
3. **Efficiency** - Minimize keystrokes needed for common operations
4. **Discoverability** - Make features accessible and easy to learn
5. **Reliability** - Ensure consistent behavior across different VSCode contexts

## Target Users

1. **Japanese-speaking developers** who use VSCode and prefer SKK-style input
2. **Developers working on Japanese-language content** who need efficient Japanese input
3. **Former Emacs users** familiar with DDSKK who have migrated to VSCode
