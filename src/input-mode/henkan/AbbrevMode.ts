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

    async onLowerAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        this.editor.insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    async onUpperAlphabet(context: AbstractKanaMode, key: string): Promise<void> {
        this.editor.insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    async onNumber(context: AbstractKanaMode, key: string): Promise<void> {
        this.editor.insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    async onSymbol(context: AbstractKanaMode, key: string): Promise<void> {
        this.editor.insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    async onSpace(context: AbstractKanaMode): Promise<void> {
        this.henkan(context, "");
    }

    async onEnter(context: AbstractKanaMode): Promise<void> {
        await this.editor.fixateMidashigo();
        await this.editor.insertOrReplaceSelection("\n");
        context.setHenkanMode(KakuteiMode.create(context, this.editor));

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

    async onCtrlJ(context: AbstractKanaMode): Promise<void> {
        // delete heading ▽ and fix the remaining text
        await this.editor.fixateMidashigo();
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
    }

    async onCtrlG(context: AbstractKanaMode): Promise<void> {
        context.setHenkanMode(KakuteiMode.create(context, this.editor));
        this.editor.clearMidashigo();
    }
}
