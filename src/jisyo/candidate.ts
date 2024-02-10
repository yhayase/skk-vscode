export class Candidate {
    word: string;
    annotation?: string;

    constructor(word: string, annotation?: string) {
        this.word = word;
        this.annotation = annotation;
    }
};

