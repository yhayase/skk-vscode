import { expect } from 'chai';
import { AbbrevMode } from '../../../../../../src/lib/skk/input-mode/henkan/AbbrevMode';
import { MockEditor } from '../../../../mocks/MockEditor';
import { EditorFactory } from '../../../../../../src/lib/skk/editor/EditorFactory';
import { AbstractKanaMode } from '../../../../../../src/lib/skk/input-mode/AbstractKanaMode';
import { MockKanaMode } from '../../../../mocks/MockKanaMode'; // Corrected path

describe('AbbrevMode', () => {
    let abbrevMode: AbbrevMode;
    let mockEditor: MockEditor;
    let mockKanaMode: AbstractKanaMode;

    beforeEach(() => {
        mockEditor = new MockEditor();
        // AbbrevMode constructor requires AbstractKanaMode context
        // MockKanaMode constructor now sets the editor in EditorFactory
        mockKanaMode = new MockKanaMode(mockEditor);

        abbrevMode = new AbbrevMode(mockKanaMode, mockEditor);
    });

    afterEach(() => {
        EditorFactory.reset();
    });

    it('getContextualName should return "abbrev"', () => {
        expect(abbrevMode.getContextualName()).to.equal('abbrev');
    });

    it('getActiveKeys should return the correct set of keys', () => {
        const expectedKeys = new Set<string>();

        // Alphabets (lower and upper)
        for (let i = 0; i < 26; i++) {
            expectedKeys.add(String.fromCharCode('a'.charCodeAt(0) + i));
            expectedKeys.add(`shift+${String.fromCharCode('a'.charCodeAt(0) + i)}`);
        }
        // Numbers
        for (let i = 0; i < 10; i++) {
            expectedKeys.add(String(i));
        }
        // Symbols (common ones used in abbrev mode, e.g. for zip codes)
        expectedKeys.add("-"); // Example: zip code like 123-4567
        // Other symbols might be directly inserted.

        // Special keys
        expectedKeys.add("space");    // Trigger henkan
        expectedKeys.add("enter");    // Fixate and newline
        expectedKeys.add("backspace");
        expectedKeys.add("ctrl+j");   // Fixate
        expectedKeys.add("ctrl+g");   // Cancel

        const activeKeys = abbrevMode.getActiveKeys();
        expect(activeKeys).to.deep.equal(expectedKeys);
    });

    // TODO: Add unit tests for AbbrevMode's input handling methods (onLowerAlphabet, onSpace, etc.)
});

// Assuming MockKanaMode exists and implements AbstractKanaMode
// Example basic implementation:
// import { AbstractKanaMode } from '../../../../../../src/lib/skk/input-mode/AbstractKanaMode';
// import { RomajiInput } from '../../../../../../src/lib/romaji/RomajiInput';
// import { IEditor } from '../../../../../../src/lib/skk/editor/IEditor';
// import { IInputMode } from '../../../../../../src/lib/skk/input-mode/IInputMode';
// import { KakuteiMode } from '../../../../../../src/lib/skk/input-mode/henkan/KakuteiMode';

// export class MockKanaMode extends AbstractKanaMode {
//     constructor(editor: IEditor) {
//         super(); // AbstractInputMode constructor uses EditorFactory, which is mocked
//         // Override the editor property if needed, or ensure EditorFactory mock works
//         (this as any).editor = editor; // Assuming protected editor property

//         // Initialize henkanMode if AbstractKanaMode constructor does it
//         (this as any).henkanMode = new KakuteiMode(this, editor); // Assuming KakuteiMode constructor
//     }

//     protected nextMode(): IInputMode { throw new Error("Method not implemented."); }
//     protected getKanaModeBaseName(): string { return "mockkana"; }
//     newRomajiInput(): RomajiInput { return new RomajiInput(false); }

//     // Implement other abstract methods from AbstractInputMode if they are called by AbbrevMode constructor or methods
//     async reset(): Promise<void> {}
//     async lowerAlphabetInput(key: string): Promise<void> {}
//     async upperAlphabetInput(key: string): Promise<void> {}
//     async spaceInput(): Promise<void> {}
//     async ctrlJInput(): Promise<void> {}
//     async ctrlGInput(): Promise<void> {}
//     async enterInput(): Promise<void> {}
//     async backspaceInput(): Promise<void> {}
//     async numberInput(key: string): Promise<void> {}
//     async symbolInput(key: string): Promise<void> {}
// }
