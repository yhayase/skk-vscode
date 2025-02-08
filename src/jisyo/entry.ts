import { Candidate } from "./candidate";
import { getGlobalJisyo } from "./jisyo";

export class Entry {
    private readonly midashigo: string;
    private readonly cookedCandidateList: Candidate[];
    private readonly rawCandidateList: Candidate[];

    constructor(midashigo: string, rawCandidateList: Candidate[], okuri: string) {
        this.midashigo = midashigo;
        this.rawCandidateList = rawCandidateList;

        if (okuri==="") {
            this.cookedCandidateList = this.rawCandidateList;
        } else {
            this.cookedCandidateList = this.rawCandidateList.map((c) => {
                return new Candidate(c.word + okuri, c.annotation);
            });
        }
    }

    getMidashigo(): string {
        return this.midashigo;
    }

    getCandidateList(): ReadonlyArray<Candidate> {
        return this.cookedCandidateList;
    }

    onCandidateSelected(index: number): void {
        // No order is changed, so no need to update the jisyo.
        if (index === 0) {
            return;
        }

        // Register reordered candidate list to the jisyo.
        const newCandidateList = [this.rawCandidateList[index]].concat(this.rawCandidateList.filter((_, i) => i !== index));
        getGlobalJisyo().set(this.midashigo, newCandidateList);
    }

    getRawCandidateList(): ReadonlyArray<Candidate> {
        return this.rawCandidateList;
    }
}