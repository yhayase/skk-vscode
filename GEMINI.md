# skk-vscode Project Context

## Operational Rules

**Strict Adherence to Instructions is Mandatory.**

1.  **Exact Compliance:** Follow all user instructions precisely. Do not deviate.
2.  **Focused Responses:** Answer questions accurately and directly. Do not provide unrelated information or perform unrequested actions.
3.  **Code Review Protocol:** When asked to review code, **only** perform the review.
    -   Do **not** rewrite the code.
    -   Do **not** commit any changes.
    -   Provide feedback and analysis only.

## Project Overview

`skk-vscode` is a Visual Studio Code extension that implements the **SKK (Simple Kana to Kanji conversion program)** input method directly within the editor. It aims to replicate the behavior of DDSKK, providing features like dictionary fetching, prefix/suffix conversion, and mode transitions (Hiragana, Katakana, ASCII, etc.).

**Current Focus:** Implementing prefix and suffix conversion features (`>`) to match standard SKK behavior.

## Technology Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** VS Code Extension API
- **Key Dependencies:**
    - `wanakana`: Kana conversion utilities.
    - `async-lock`: For handling concurrent command execution safely.
    - `mocha` / `@vscode/test-electron`: Testing framework.

## Architecture

The extension follows a state machine pattern to handle different input modes.

### Key Components

1.  **Extension Entry Point (`src/extension.ts`):**
    -   Registers VS Code commands (e.g., `skk.lowerAlphabetInput`, `skk.spaceInput`).
    -   Uses `AsyncLock` to serialize command execution.
    -   Manages activation and deactivation.
    -   Initializes the `EditorFactory` and dictionary.

2.  **Input Modes (`src/lib/skk/input-mode/`):**
    -   **`IInputMode`:** Interface defining input handlers (`lowerAlphabetInput`, `spaceInput`, etc.).
    -   **Concrete Modes:** `HiraganaMode`, `KatakanaMode`, `AsciiMode`, `MidashigoMode` (conversion), `InlineHenkanMode`.
    -   **State Transition:** Modes delegate input handling and transition to other modes based on user input.

3.  **Dictionary System (`src/lib/skk/jisyo/`):**
    -   **`jisyo.ts`:** Manages dictionary loading and lookup.
    -   **Loader:** Fetches dictionaries from configured URLs (defaults to GitHub raw URLs).
    -   **Cache:** Caches dictionary entries for performance.

4.  **Editor Abstraction (`src/lib/skk/editor/` & `src/VSCodeEditor.ts`):**
    -   **`IEditor`:** Abstract interface for editor interactions.
    -   **`VSCodeEditor`:** Concrete implementation wrapping VS Code API calls.
    -   **`EditorFactory`:** Singleton factory for accessing the editor instance.

## Build and Run

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **Install Dependencies** | `npm install` | Installs project dependencies. |
| **Compile** | `npm run compile` | Compiles TypeScript to JavaScript (incrememtal). |
| **Build** | `npm run build` | Cleans `out/` and performs a full build. |
| **Watch** | `npm run watch` | Watches for changes and recompiles. |
| **Lint** | `npm run lint` | Runs ESLint. |
| **Test (All)** | `npm test` | Runs both unit and integration tests. |
| **Test (Unit)** | `npm run test:unit` | Runs only unit tests (`test/unit`). |
| **Test (Integration)** | `npm run test:integration` | Runs extension integration tests (`test/integration`). |
| **Package** | `npm run package` | Packages extension into .vsix. |
| **Release** | `npm run release:patch` / `minor` / `major` | Runs checks, tests, vsce publish, and git push. |

## Development Conventions

- **Code Style:** Follows standard TypeScript conventions and project-specific ESLint rules.
- **Testing:**
    -   **Unit Tests:** Place in `test/unit/`. Mock VS Code dependencies where possible.
    -   **Integration Tests:** Place in `test/integration/`. These run inside a VS Code instance.
- **Git Strategy:**
    -   Use `feature/` or `bugfix/` branches.
    -   Merge to `main` only after tests pass.
- **Memory Bank:** Refer to `memory-bank/` for detailed architectural context and project status.

## Key Files & Directories

- `src/extension.ts`: Main entry point.
- `src/lib/skk/input-mode/`: Input mode implementations (Core logic).
- `src/lib/skk/jisyo/`: Dictionary handling logic.
- `test/`: Test suites.
- `package.json`: Configuration, scripts, and extension manifest.
- `.vscode/launch.json`: Debugging configurations.