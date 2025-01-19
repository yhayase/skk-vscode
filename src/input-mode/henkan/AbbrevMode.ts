import { DeleteLeftResult, IEditor } from "../../editor/IEditor";
import { insertOrReplaceSelection } from "../../extension";
import { Entry } from "../../jisyo/entry";
import { getGlobalJisyo } from "../../jisyo/jisyo";
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

    private findCandidates(midashigo: string): Entry | Error {
        const candidates = getGlobalJisyo().get(midashigo);
        if (candidates === undefined) {
            return new Error('変換できません');
        } else {
            return new Entry(midashigo, candidates, "");
        }
    }

    private henkan(context: AbstractKanaMode, optionalSuffix?: string): void {
        const midashigo = this.editor.extractMidashigo();
        if (!midashigo || midashigo.length === 0) {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return;
        }

        const jisyoEntry = this.findCandidates(midashigo);
        if (jisyoEntry instanceof Error) {
            context.showErrorMessage(jisyoEntry.message);
            return;
        }

        context.setHenkanMode(new InlineHenkanMode(context, this.editor, this, midashigo, "", jisyoEntry, optionalSuffix));
    }

    onLowerAlphabet(context: AbstractKanaMode, key: string): void {
        insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    onUpperAlphabet(context: AbstractKanaMode, key: string): void {
        insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    onNumber(context: AbstractKanaMode, key: string): void {
        insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    onSymbol(context: AbstractKanaMode, key: string): void {
        insertOrReplaceSelection(key).then((value) => {
            this.editor.showRemainingRomaji("", false, 0);
        });
    }

    onSpace(context: AbstractKanaMode): void {
        this.henkan(context, "");
    }

    onEnter(context: AbstractKanaMode): void {
        throw new Error("Method not implemented.");
    }

    onBackspace(context: AbstractKanaMode): void {
        switch (this.editor.deleteLeft()) {
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
