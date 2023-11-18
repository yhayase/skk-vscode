import * as fs from "fs";

export class JisyoCandidate {
    word: string;
    annotation?: string;

    constructor(word: string, annotation?: string) {
        this.word = word;
        this.annotation = annotation;
    }
};

type Jisyo = Map<string, JisyoCandidate[]>;

export const globalJisyo: Jisyo = loadJisyo("/usr/share/skk/SKK-JISYO.L");

function loadJisyo(path: string): Jisyo {
    const jisyo: Jisyo = new Map();
    const rawLines: Buffer = fs.readFileSync(path);
    const eucJpDecoder = new TextDecoder('euc-jp');
    const lines = eucJpDecoder.decode(rawLines).split("\n");
    for (const line of lines) {
        if (line.startsWith(";;")) {
            // Skip comments
            continue;
        }

        const [word, candidates] = line.split(" /", 2);
        if (word === undefined || candidates === undefined) {
            // Skip malformed or empty lines
            continue;
        }

        const candidateList: JisyoCandidate[] = [];
        candidates.split("/").forEach((candidateStr) => {
            const [candidate, annotation] = candidateStr.split(";", 2);
            if (candidate === undefined || candidate === "") {
                // Skip empty candidate
                return;
            }
            candidateList.push(new JisyoCandidate(candidate, annotation));
        });

        if (jisyo.has(word)) {
            jisyo.get(word)?.push(...candidateList);
        } else {
            jisyo.set(word, candidateList);
        }
    }
    return jisyo;
}