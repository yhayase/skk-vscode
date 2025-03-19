import { DeleteLeftResult, IEditor } from "../../editor/IEditor";
import { Entry } from "../../jisyo/entry";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { AbstractMidashigoMode } from "./AbstractMidashigoMode";
import { InlineHenkanMode } from "./InlineHenkanMode";
import { KakuteiMode } from "./KakuteiMode";

export class AbbrevMode extends AbstractMidashigoMode {
    constructor(context: AbstractKanaMode, editor: IEditor) {
        super("▽", editor);

        const insertStr = "▽";
        this.editor.setMidashigoStartToCurrentPosition();
        context.insertStringAndShowRemaining(insertStr, "", false);
    }

    private async henkan(context: AbstractKanaMode, optionalSuffix?: string): Promise<void> {
        const midashigo = this.editor.extractMidashigo();
        if (!midashigo || midashigo.length === 0) {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return;
        }

        const jisyoCandidates = await this.editor.getJisyoProvider().lookupCandidates(midashigo);
        if (jisyoCandidates=== undefined) {
            context.showErrorMessage("変換できません");
            return;
        }
        context.setHenkanMode(new InlineHenkanMode(context, this.editor, this, midashigo, "", jisyoCandidates, optionalSuffix));
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        this.editor.insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        this.editor.insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    onNumber(context: AbstractKanaMode, key: string): void {
        this.editor.insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    onSymbol(context: AbstractKanaMode, key: string): void {
        this.editor.insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    onSpace(context: AbstractKanaMode): void {
        this.henkan(context, "");
    }

    onEnter(context: AbstractKanaMode): void {
        throw new Error("Method not implemented.");
    }

    async onBackspace(context: AbstractKanaMode): Promise<void> {
        switch (await this.editor.deleteLeft()) {
            case DeleteLeftResult.markerDeleted:
            case DeleteLeftResult.markerNotFoundAndOtherCharacterDeleted:
                context.setHenkanMode(KakuteiMode.create(context, this.editor));
                break;
            case DeleteLeftResult.otherCharacterDeleted:
                // do nothing
                break;
            case DeleteLeftResult.noEditor:
                // error
                break;
        }
    }

    onCtrlJ(context: AbstractKanaMode): void {
        // delete heading ▽ and fix the remaining text
        this.editor.fixateMidashigo();
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
    }

    onCtrlG(context: AbstractKanaMode): void {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        this.editor.clearMidashigo();
    }
}
