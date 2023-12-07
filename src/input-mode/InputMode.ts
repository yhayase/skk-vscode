export interface InputMode {
    reset: () => void;
    lowerAlphabetInput: (key: string) => void;
    upperAlphabetInput: (key: string) => void;
    spaceInput: () => void;   
    ctrlJInput: () => void;
    enterInput: () => void;
    backspaceInput: () => void;
    numberInput: (key: string) => void;
    symbolInput: (key: string) => void;
};    