import { AbstractKanaMode } from '../../../src/lib/skk/input-mode/AbstractKanaMode';
import { RomajiInput } from '../../../src/lib/romaji/RomajiInput';
import { IEditor } from '../../../src/lib/skk/editor/IEditor';
import { IInputMode } from '../../../src/lib/skk/input-mode/IInputMode';
import { KakuteiMode } from '../../../src/lib/skk/input-mode/henkan/KakuteiMode'; // Assuming KakuteiMode is used internally

import { EditorFactory } from '../../../src/lib/skk/editor/EditorFactory'; // Import EditorFactory

export class MockKanaMode extends AbstractKanaMode {
    constructor(editor: IEditor) {
        // Set the mock editor in the factory before calling super(),
        // as AbstractInputMode's constructor uses EditorFactory.getInstance().getEditor().
        EditorFactory.setInstance(editor);
        super();
    }

    protected nextMode(): IInputMode {
        // Return a mock or dummy mode if this is ever called in a test
        throw new Error("MockKanaMode.nextMode not implemented or called unexpectedly");
    }

    protected getKanaModeBaseName(): string {
        return "mockkana"; // Return a dummy name
    }

    newRomajiInput(): RomajiInput {
        // Return a mock or dummy RomajiInput if needed by tests
        // For getActiveKeys/getContextualName tests, this might not be called.
        // If called, ensure RomajiInput can be instantiated without complex dependencies.
        return new RomajiInput(false); // Assuming RomajiInput can be instantiated
    }

    // Implement other abstract methods from AbstractInputMode if they are called by the mode being tested
    // (e.g., AbbrevMode constructor or methods might call these on the context)
    // Based on AbbrevMode constructor, it calls context.insertStringAndShowRemaining and context.newRomajiInput.
    // insertStringAndShowRemaining is not abstract in AbstractKanaMode, but it calls editor methods.
    // newRomajiInput is abstract and implemented above.

    // Add stubs for other IInputMode methods if AbbrevMode calls them on the context
    async reset(): Promise<void> {}
    async lowerAlphabetInput(key: string): Promise<void> {}
    async upperAlphabetInput(key: string): Promise<void> {}
    async spaceInput(): Promise<void> {}
    async ctrlJInput(): Promise<void> {}
    async ctrlGInput(): Promise<void> {}
    async enterInput(): Promise<void> {}
    async backspaceInput(): Promise<void> {}
    async numberInput(key: string): Promise<void> {}
    async symbolInput(key: string): Promise<void> {}
    // getActiveKeys and getContextualName are implemented in AbstractKanaMode or its parent
}
