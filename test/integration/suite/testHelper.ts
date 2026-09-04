import * as vscode from 'vscode';

export const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

export async function waitForCondition(
    condition: () => boolean,
    timeoutMs: number = 4000,
    errorMsg: string = 'Timeout waiting for condition'
): Promise<void> {
    const startTime = Date.now();
    while (!condition()) {
        if (Date.now() - startTime > timeoutMs) {
            throw new Error(`${errorMsg} (exceeded ${timeoutMs}ms)`);
        }
        await sleep(10);
    }
}

export async function waitForNoActiveEditor(timeoutMs: number = 4000): Promise<void> {
    await waitForCondition(
        () => !vscode.window.activeTextEditor,
        timeoutMs,
        'Timeout waiting for no active editor'
    );
}

export async function waitForActiveEditor(timeoutMs: number = 4000): Promise<vscode.TextEditor> {
    await waitForCondition(
        () => !!vscode.window.activeTextEditor,
        timeoutMs,
        'Timeout waiting for active editor'
    );
    return vscode.window.activeTextEditor!;
}

export async function closeAllEditorsAndWait(timeoutMs: number = 4000): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await waitForNoActiveEditor(timeoutMs);
}

export async function openNewUntitledFileAndWait(timeoutMs: number = 4000): Promise<vscode.TextEditor> {
    await closeAllEditorsAndWait(timeoutMs);
    await vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
    const editor = await waitForActiveEditor(timeoutMs);
    await vscode.commands.executeCommand('skk.nop');
    return editor;
}

export async function insertTextAtCursor(text: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        throw new Error('No active editor to insert text into');
    }
    const pos = editor.selection.active;
    await editor.edit(builder => {
        builder.insert(pos, text);
    });
    const newPos = editor.document.positionAt(editor.document.offsetAt(pos) + text.length);
    editor.selection = new vscode.Selection(newPos, newPos);
}

export async function waitForDocumentContent(
    document: vscode.TextDocument | undefined,
    substring: string,
    timeoutMs: number = 4000
): Promise<void> {
    await waitForCondition(
        () => !!document && document.getText().includes(substring),
        timeoutMs,
        `Timeout waiting for document to contain "${substring}". Current: "${document?.getText()}"`
    );
}

export async function waitForDocumentEquals(
    document: vscode.TextDocument | undefined,
    expectedText: string,
    timeoutMs: number = 4000
): Promise<void> {
    await waitForCondition(
        () => document?.getText() === expectedText,
        timeoutMs,
        `Timeout waiting for document text to equal "${expectedText}". Current: "${document?.getText()}"`
    );
}
