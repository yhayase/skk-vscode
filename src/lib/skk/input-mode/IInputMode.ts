export interface IInputMode {
    reset: () => Promise<void>;
    lowerAlphabetInput: (key: string) => Promise<void>;
    upperAlphabetInput: (key: string) => Promise<void>;
    spaceInput: () => Promise<void>;
    ctrlJInput: () => Promise<void>;
    ctrlGInput: () => Promise<void>;
    enterInput: () => Promise<void>;
    backspaceInput: () => Promise<void>;
    numberInput: (key: string) => Promise<void>;
    symbolInput: (key: string) => Promise<void>;
    getActiveKeys: () => Set<string>; // Returns a set of normalized key names active in this mode
    getContextualName: () => string; // Returns a string representation of the mode for context (e.g., "ascii", "hiragana:kakutei")
};
