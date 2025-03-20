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

    showInlineDialog(context: AbstractKanaMode, midashigo: string, candidate: Candidate) {
        this.editor.showCandidate(undefined, `Really delete \"${midashigo} /${candidate.word}/\"? (Y/N)`);
    }

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === "y" || key === "n") {
            throw new Error("Type Y or N in upper case");
        }
        throw new Error("Type Y or N");
    }

    clearInlineDialogAndReturnToKakuteiMode(context: AbstractKanaMode) {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        this.editor.clearCandidate().then(() => {
            context.insertStringAndShowRemaining("", "", false);
        });
    }

    async onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        if (key === "Y") {
            await this.editor.getJisyoProvider().deleteCandidate(this.midashigo, this.candidate);
            this.clearInlineDialogAndReturnToKakuteiMode(context);
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
}
