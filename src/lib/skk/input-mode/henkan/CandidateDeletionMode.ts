import { AbstractHenkanMode } from './AbstractHenkanMode';
import { AbstractKanaMode } from '../AbstractKanaMode';
import { IEditor } from '../../editor/IEditor';
import { KakuteiMode } from './KakuteiMode';
import { InlineHenkanMode } from './InlineHenkanMode';
import { Candidate } from '../../jisyo/candidate';

export class CandidateDeletionMode extends AbstractHenkanMode {
    private readonly prevMode: InlineHenkanMode;
    private readonly candidate: Candidate;
    private readonly midashigo: string;

    constructor(context: AbstractKanaMode, editor: IEditor, prevMode: InlineHenkanMode, midashigo: string, candidate: Candidate) {
        super("Delete?", editor);
        this.prevMode = prevMode;
        this.midashigo = midashigo;
        this.candidate = candidate;

        this.showInlineDialog(context, this.midashigo, this.candidate);
    }

    private async showInlineDialog(context: AbstractKanaMode, midashigo: string, candidate: Candidate): Promise<void> {
        await this.editor.showCandidate(undefined, `Really delete \"${midashigo} /${candidate.word}/\"? (Y/N)`, '');
    }

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === "y" || key === "n") {
            throw new Error("Type Y or N in upper case");
        }
        throw new Error("Type Y or N");
    }

    private async clearInlineDialogAndReturnToKakuteiMode(context: AbstractKanaMode) {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        await this.editor.clearCandidate();
        await context.insertStringAndShowRemaining("", "", false);
    }

    async onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === "Y") {
            await this.editor.getJisyoProvider().deleteCandidate(this.midashigo, this.candidate);
            await this.clearInlineDialogAndReturnToKakuteiMode(context);
            return;
        }

        if (key === "N") {
            context.setHenkanMode(this.prevMode);
            this.prevMode.showCandidate(context);
            return;
        }

        throw new Error("Type Y or N");
    }

    async onCtrlG(context: AbstractKanaMode): Promise<void> {
        context.setHenkanMode(this.prevMode);
        this.prevMode.showCandidate(context);
    }

    async onNumber(context: AbstractKanaMode, key: string): Promise<void> {
        throw new Error("Type Y or N");
    }

    async onSymbol(context: AbstractKanaMode, key: string): Promise<void> {
        throw new Error("Type Y or N");
    }

    async onSpace(context: AbstractKanaMode): Promise<void> {
        throw new Error("Type Y or N");
    }

    async onEnter(context: AbstractKanaMode): Promise<void> {
        throw new Error("Type Y or N");
    }

    async onBackspace(context: AbstractKanaMode): Promise<void> {
        throw new Error("Type Y or N");
    }

    async onCtrlJ(context: AbstractKanaMode): Promise<void> {
        throw new Error("Type Y or N");
    }

    public override getActiveKeys(): Set<string> {
        const keys = new Set<string>();

        // All alphabet keys (lower and upper) as they are caught to show an error except for Y and N.
        // Y and N are treated separately in onUpperAlphabet.
        for (let i = 0; i < 26; i++) {
            const charLower = String.fromCharCode('a'.charCodeAt(0) + i);
            const charUpper = `shift+${charLower}`;

            keys.add(charLower);
            keys.add(charUpper);
        }

        // Other keys like space, enter, numbers, symbols also throw errors.
        // Add them if they should be explicitly handled to show "Type Y or N".
        keys.add("space");
        keys.add("enter");
        keys.add("backspace");
        // Add numbers 0-9
        for (let i = 0; i <= 9; i++) {
            keys.add(i.toString());
        }
        // Common symbols that might be pressed
        keys.add(".");
        keys.add(",");
        keys.add("/");
        keys.add("ctrl+g");
        keys.add("ctrl+j");

        return keys;
    }

    public override getContextualName(): string {
        return "candidateDeletion";
    }
}
