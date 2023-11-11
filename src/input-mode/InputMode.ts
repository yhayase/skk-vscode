export interface InputMode {
    reset: () => void;
    lowerAlphabetInput: (key: string) => void;
    upperAlphabetInput: (key: string) => void;
    spaceInput: () => void;   
    ctrlJInput: () => void;
    backspaceInput: () => void;
    numberInput: (key: string) => void;
};    