export interface IInputMode {
    reset: () => void;
    lowerAlphabetInput: (key: string) => void;
    upperAlphabetInput: (key: string) => void;
    spaceInput: () => void;
    ctrlJInput: () => void;
    ctrlGInput: () => void;
    enterInput: () => void;
    backspaceInput: () => void;
    numberInput: (key: string) => void;
    symbolInput: (key: string) => void;
    getActiveKeys: () => Set<string>; // Returns a set of normalized key names active in this mode
    getContextualName: () => string; // Returns a string representation of the mode for context (e.g., "ascii", "hiragana:kakutei")
};
