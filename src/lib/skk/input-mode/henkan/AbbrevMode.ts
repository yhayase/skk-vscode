import { DeleteLeftResult, IEditor } from "../../editor/IEditor";
import { AbstractKanaMode } from "../AbstractKanaMode";
import { AbstractMidashigoMode } from "./AbstractMidashigoMode";
import { InlineHenkanMode } from "./InlineHenkanMode";
import { KakuteiMode } from "./KakuteiMode";
import { Candidate } from "../../jisyo/candidate";
import { Entry } from "../../jisyo/entry";

export class AbbrevMode extends AbstractMidashigoMode {
    constructor(context: AbstractKanaMode, editor: IEditor) {
        super("▽", editor);

        const insertStr = "▽";
        this.editor.setMidashigoStartToCurrentPosition();
        context.insertStringAndShowRemaining(insertStr, "", false);
    }

    resetOkuriState(): void {
        // do nothing
    }

    private async _henkanInternal(context: AbstractKanaMode, midashigo: string): Promise<void> {
        if (midashigo.length === 0) {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return;
        }

        const jisyoCandidates = await this.editor.getJisyoProvider().lookupCandidates(midashigo);
        if (jisyoCandidates === undefined) {
            await this.editor.openRegistrationEditor(midashigo, "");
            return;
        }

        // 見出し語が 'today' の場合、現在の日付を変換候補として追加
        let candidates = jisyoCandidates.getRawCandidateList() as Candidate[];
        if (midashigo.toLowerCase() === 'today') {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const date = now.getDate();
            const day = now.getDay();
            const dayStr = ['日', '月', '火', '水', '木', '金', '土'][day];
            const dateStr = `${year}年${month}月${date}日(${dayStr})`;
            const dateCandidate = new Candidate(dateStr);
            candidates = [dateCandidate, ...candidates];
        }

        const entry =  new Entry(midashigo, candidates, "");
        context.setHenkanMode(new InlineHenkanMode(context, this.editor, this, midashigo, "", entry, "", ""));
    }

    private async henkan(context: AbstractKanaMode): Promise<void> {
        const midashigo = this.editor.extractMidashigo();
        if (!midashigo || midashigo.length === 0) {
            context.setHenkanMode(KakuteiMode.create(context, this.editor));
            return;
        }

        await this._henkanInternal(context, midashigo);
        return;
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
        this.henkan(context);
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

    public override getActiveKeys(): Set<string> {
        const keys = new Set<string>();

        // Currently, we do not need to handle alphabets, numbers, and symbols especially so that the editor deals with them.
        // Special keys
        keys.add("space");    // Trigger henkan
        keys.add("enter");    // Fixate and newline
        keys.add("ctrl+j");   // Fixate
        keys.add("ctrl+g");   // Cancel
        keys.add("backspace"); // Delete left or delete midashigo marker

        return keys;
    }

    public override getContextualName(): string {
        return "abbrev";
    }
}
